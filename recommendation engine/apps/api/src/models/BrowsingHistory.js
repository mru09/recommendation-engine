import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  eventType: { type: String, enum: ["VIEW", "CLICK", "SEARCH", "ADD_TO_CART", "WISHLIST", "PURCHASE"], default: "VIEW" },
  sessionId: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("BrowsingHistory", schema);
