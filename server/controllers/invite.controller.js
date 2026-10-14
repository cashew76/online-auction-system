import Product from "../models/product.model.js";
import Auction from "../models/auction.model.js";
import AuctionInvite from "../models/auctionInvite.model.js";
import { getCreditSummary } from "../services/credit.service.js";
import { getIO } from "../socket/index.js";

const sortBids = (bids = []) =>
  [...bids].sort(
    (a, b) => b.bidAmount - a.bidAmount || new Date(a.bidTime) - new Date(b.bidTime),
  );

const publicItem = (product, inviteId, activeInviteIds) => {
  const bids = [...(product.bids || [])].sort(
    (a, b) => new Date(b.bidTime) - new Date(a.bidTime),
  );

  const eligibleBids = sortBids(product.bids || []).filter(
    (bid) => bid.invite && activeInviteIds.has(bid.invite.toString()),
  );
  const top = eligibleBids[0];

  return {
    _id: product._id,
    itemName: product.itemName,
    itemDescription: product.itemDescription,
    itemCategory: product.itemCategory,
    itemImage: product.itemImage,
    startingPrice: product.startingPrice,
    currentPrice: top ? top.bidAmount : product.startingPrice,
    bids,
    highBid: top ? top.bidAmount : product.startingPrice,
    highBidderId: top?.invite?.toString() || null,
    highBidderLabel: top?.bidderLabel || null,
    amWinning: top?.invite?.toString() === inviteId.toString(),
  };
};

const getActiveInviteIds = async (auctionId) => {
  const activeInvites = await AuctionInvite.find({
    auction: auctionId,
    active: true,
  }).select("_id");

  return new Set(activeInvites.map((invite) => invite._id.toString()));
};

export const getInviteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.invite.auction).select(
      "name description startDate endDate",
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const [items, activeInviteIds] = await Promise.all([
      Product.find({ auction: auction._id }).sort({ createdAt: 1 }),
      getActiveInviteIds(auction._id),
    ]);

    const credits = await getCreditSummary(req.invite);

    await AuctionInvite.updateOne(
      { _id: req.invite._id },
      { $set: { lastUsedAt: new Date() } },
    );

    return res.json({
      auction,
      bidder: { id: req.invite._id, label: req.invite.label },
      credits,
      items: items.map((item) => publicItem(item, req.invite._id, activeInviteIds)),
    });
  } catch (error) {
    console.error("Invite auction view error:", error);
    return res.status(500).json({ message: "Unable to load auction" });
  }
};

export const placeInviteBid = async (req, res) => {
  try {
    const amount = Number(req.body.bidAmount);
    if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
      return res.status(400).json({ message: "Bid must be a whole number of credits" });
    }

    const item = await Product.findOne({
      _id: req.params.itemId,
      auction: req.invite.auction,
    });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const auction = await Auction.findById(req.invite.auction);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const now = new Date();
    if (now < auction.startDate) {
      return res.status(400).json({ message: "Auction has not started" });
    }
    if (now >= auction.endDate) {
      return res.status(400).json({ message: "Auction has ended" });
    }

    const activeInviteIds = await getActiveInviteIds(req.invite.auction);
    const eligibleBids = sortBids(item.bids || []).filter(
      (bid) => bid.invite && activeInviteIds.has(bid.invite.toString()),
    );
    const top = eligibleBids[0];
    const effectiveCurrentPrice = top ? top.bidAmount : item.startingPrice;

    if (item.currentPrice !== effectiveCurrentPrice) {
      item.currentPrice = effectiveCurrentPrice;
      await item.save();
    }

    const minimum = Math.max(item.startingPrice, effectiveCurrentPrice + 1);
    if (amount < minimum) {
      return res.status(400).json({ message: `Bid must be at least ${minimum} credits` });
    }

    const credits = await getCreditSummary(req.invite);
    const ownCurrentCommitment =
      top?.invite?.toString() === req.invite._id.toString() ? effectiveCurrentPrice : 0;

    if (amount > credits.available + ownCurrentCommitment) {
      return res.status(400).json({ message: "Not enough available credits" });
    }

    const updated = await Product.findOneAndUpdate(
      {
        _id: item._id,
        auction: req.invite.auction,
        currentPrice: effectiveCurrentPrice,
      },
      {
        $set: { currentPrice: amount },
        $push: {
          bids: {
            invite: req.invite._id,
            bidderLabel: req.invite.label,
            bidAmount: amount,
          },
        },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(409).json({ message: "Price changed. Refresh and try again." });
    }

    const newCredits = await getCreditSummary(req.invite);
    const refreshedActiveInviteIds = await getActiveInviteIds(req.invite.auction);

    const payload = {
      item: publicItem(updated, req.invite._id, refreshedActiveInviteIds),
      bidderLabel: req.invite.label,
      bidderId: req.invite._id,
      bidAmount: amount,
    };

    try {
      getIO().to(`event:${req.invite.auction}`).emit("auction:bidPlaced", payload);
    } catch (error) {
      console.error("Socket bid broadcast failed:", error);
    }

    return res.json({ message: "Bid placed", ...payload, credits: newCredits });
  } catch (error) {
    console.error("Invite bid error:", error);
    return res.status(500).json({ message: "Unable to place bid" });
  }
};
