import Product from "../models/product.model.js";
import AuctionInvite from "../models/auctionInvite.model.js";

export const getCreditSummary = async (invite) => {
  // Disabled bidders cannot have committed/winning credits.
  if (!invite.active) {
    return {
      initial: invite.initialCredits,
      committed: 0,
      available: invite.initialCredits,
    };
  }

  // Get all active bidders for this auction.
  const activeInvites = await AuctionInvite.find({
    auction: invite.auction,
    active: true,
  }).select("_id");

  const activeInviteIds = new Set(
    activeInvites.map((activeInvite) => activeInvite._id.toString()),
  );

  const items = await Product.find({
    auction: invite.auction,
    "bids.0": { $exists: true },
  }).select("startingPrice currentPrice bids");

  let committed = 0;

  for (const item of items) {
    // Only active bidders can be considered the high bidder.
    const eligibleBids = [...item.bids]
      .filter(
        (bid) =>
          bid.invite && activeInviteIds.has(bid.invite.toString()),
      )
      .sort(
        (a, b) =>
          b.bidAmount - a.bidAmount ||
          new Date(a.bidTime) - new Date(b.bidTime),
      );

    const top = eligibleBids[0];

    if (top?.invite?.toString() === invite._id.toString()) {
      committed += top.bidAmount;
    }
  }

  return {
    initial: invite.initialCredits,
    committed,
    available: Math.max(0, invite.initialCredits - committed),
  };
};
