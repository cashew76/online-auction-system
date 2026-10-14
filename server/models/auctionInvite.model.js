import mongoose from "mongoose";

const auctionInviteSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  label: { type: String, default: "Bidder", trim: true },
  initialCredits: { type: Number, default: 1000, min: 0 },
  active: { type: Boolean, default: true },
  lastUsedAt: Date,
}, { timestamps: true });

export default mongoose.model("AuctionInvite", auctionInviteSchema);
