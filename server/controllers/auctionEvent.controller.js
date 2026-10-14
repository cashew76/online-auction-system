import Auction from "../models/auction.model.js";
import AuctionInvite from "../models/auctionInvite.model.js";
import Product from "../models/product.model.js";
import { newInviteToken, hashInviteToken } from "../utils/inviteToken.js";
import { getCreditSummary } from "../services/credit.service.js";
import { getIO } from "../socket/index.js";

const owned = async (id, user) => {
  if (user.role === "superadmin") {
    return Auction.findById(id);
  }

  return Auction.findOne({
    _id: id,
    owner: user.id,
  });
};

export const createEvent = async (req, res) => {
  try {
    const { name, description = "", startDate, endDate } = req.body;

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(endDate);

    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    if (start > ninetyDays) {
      return res.status(400).json({
        message: "Start date must be within 90 days"
      });
    }

    if (end > ninetyDays) {
      return res.status(400).json({
        message: "End date must be within 90 days"
      });
    }

    if (!name || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        message: "Name and a valid end date are required"
      });
    }

    const auction = await Auction.create({
      name,
      description,
      startDate: start,
      endDate: end,
      owner: req.user.id
    });

    res.status(201).json({ auction });

  } catch (err) {
    console.error("createEvent failed:", err);

    res.status(500).json({
      message: err.message
    });
  }
};


export const listEvents = async (req, res) => {
  res.json({ auctions: await Auction.find({ owner: req.user.id }).sort({ createdAt: -1 }) });
};

export const getEvent = async (req, res) => {
  const auction = await owned(  req.params.auctionId,  req.user);
  if (!auction) return res.status(404).json({ message: "Auction not found" });

  const [items, invites] = await Promise.all([
    Product.find({ auction: auction._id }).sort({ createdAt: 1 }).lean(),
    AuctionInvite.find({ auction: auction._id })
      .select("label initialCredits active createdAt lastUsedAt auction")
      .sort({ createdAt: 1 }),
  ]);

  const invitesWithCredits = await Promise.all(
    invites.map(async (invite) => {
      const credits = await getCreditSummary(invite);
      return {
        ...invite.toObject(),
        initialCredits: credits.initial,
        committedCredits: credits.committed,
        availableCredits: credits.available,
      };
    }),
  );

  res.json({ auction, items, invites: invitesWithCredits });
};

export const addItem = async (req, res) => {
  const auction = await owned(req.params.auctionId, req.user);
  if (!auction) return res.status(404).json({ message: "Auction not found" });
  if (new Date() >= auction.endDate) return res.status(400).json({ message: "Auction has ended" });

  const { itemName, itemDescription, itemCategory = "Other", startingPrice, public_id, secure_url } = req.body;
  if (!itemName || !itemDescription || !Number.isFinite(Number(startingPrice)) || Number(startingPrice) < 1) {
    return res.status(400).json({ message: "Invalid item" });
  }

  const item = await Product.create({
    auction: auction._id,
    itemName,
    itemDescription,
    itemCategory,
    startingPrice: Number(startingPrice),
    currentPrice: Number(startingPrice),
    itemImage: { public_id, url: secure_url },
  });
  res.status(201).json({ item });
};

export const createInvite = async (req, res) => {
  const auction = await owned(  req.params.auctionId,  req.user);
  if (!auction) return res.status(404).json({ message: "Auction not found" });
  if (new Date() >= auction.endDate) return res.status(400).json({ message: "Auction has ended" });

  const token = newInviteToken();
  const invite = await AuctionInvite.create({
    auction: auction._id,
    tokenHash: hashInviteToken(token),
    label: (req.body.label || "Bidder").trim(),
    initialCredits: 1000,
  });

  res.status(201).json({
    invite: { _id: invite._id, label: invite.label, initialCredits: invite.initialCredits, active: invite.active },
    guid: token,
  });
};

export const disableInvite = async (req, res) => {
  const auction = await owned(  req.params.auctionId,  req.user);
  if (!auction) return res.status(404).json({ message: "Auction not found" });

  const invite = await AuctionInvite.findOneAndUpdate(
    { _id: req.params.inviteId, auction: auction._id },
    { $set: { active: false } },
    { new: true },
  );
  if (!invite) return res.status(404).json({ message: "Invitation not found" });

  const activeInvites = await AuctionInvite.find({ auction: auction._id, active: true }).select("_id");
  const activeInviteIds = new Set(activeInvites.map((activeInvite) => activeInvite._id.toString()));
  const items = await Product.find({ auction: auction._id });

  for (const item of items) {
    const eligibleBids = (item.bids || [])
      .filter((bid) => bid.invite && activeInviteIds.has(bid.invite.toString()))
      .sort(
        (a, b) =>
          b.bidAmount - a.bidAmount ||
          new Date(a.bidTime) - new Date(b.bidTime),
      );
    const topBid = eligibleBids[0];
    item.currentPrice = topBid ? topBid.bidAmount : item.startingPrice;
    await item.save();
  }

  try {
    getIO().to(`event:${auction._id}`).emit("auction:inviteDisabled", {
      inviteId: invite._id.toString(),
    });
  } catch (error) {
    console.error("Socket invite disable broadcast failed:", error);
  }

  res.json({ message: "Invitation disabled and high bids recalculated" });
};


export const renameAuction = async (req, res) => {
  const auction = await owned(
    req.params.auctionId,
    req.user
  );

  if (!auction) {
    return res.status(404).json({
      message: "Auction not found"
    });
  }

  const name = (req.body.name || "").trim();

  if (!name) {
    return res.status(400).json({
      message: "Auction name is required"
    });
  }

  auction.name = name;

  await auction.save();

  res.json({
    auction
  });
};
