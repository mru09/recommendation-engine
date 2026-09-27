import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  eventType: { type: String, enum: ["RECOMMENDATION_SHOWN", "RECOMMENDATION_CLICKED", "RECOMMENDATION_WISHLISTED", "RECOMMENDATION_PURCHASED", "RECOMMENDATION_DISMISSED"], required: true, index: true },
  recommendationSource: { type: String, enum: ["RULE_BASED", "VECTOR_RAG", "HYBRID"], default: "HYBRID" },
  recommendationScore: Number,
  position: Number,
  reason: String,
  sessionId: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });
schema.index({ userId: 1, createdAt: -1 });
export default mongoose.model("RecommendationEvent", schema);
