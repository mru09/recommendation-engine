import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  addedAt: { type: Date, default: Date.now }
}, { timestamps: true });
schema.index({ userId: 1, productId: 1 }, { unique: true });
export default mongoose.model("Wishlist", schema);
