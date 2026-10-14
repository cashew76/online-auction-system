import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

auctionSchema.index({ owner: 1, createdAt: -1 });
export default mongoose.model("Auction", auctionSchema);
