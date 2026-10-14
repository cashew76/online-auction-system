import mongoose from "mongoose";
const bidSchema = new mongoose.Schema({
  invite: { type: mongoose.Schema.Types.ObjectId, ref: "AuctionInvite", required: true },
  bidderLabel: { type: String, required: true },
  bidAmount: { type: Number, required: true },
  bidTime: { type: Date, default: Date.now },
});
const productSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true, index: true },
  itemName: { type: String, required: true, trim: true },
  itemDescription: { type: String, required: true },
  itemCategory: { type: String, default: "Other" },
  itemImage: { public_id: String, url: String },
  startingPrice: { type: Number, required: true, min: 1 },
  currentPrice: { type: Number, default: 0 },
  bids: [bidSchema],
  winnerInvite: { type: mongoose.Schema.Types.ObjectId, ref: "AuctionInvite", default: null },
  isSold: { type: Boolean, default: false },
}, { timestamps: true });
productSchema.index({ auction: 1, createdAt: -1 });
export default mongoose.model("Product", productSchema);
