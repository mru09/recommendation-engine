import mongoose from "mongoose";

const productEmbeddingSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
      index: true
    },
    embedding: {
      type: [Number],
      required: true
    },
    embeddingModel: { type: String, required: true },
    dimensions: { type: Number, required: true },
    contentHash: { type: String, required: true, index: true },
    sourceVersion: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: "product_embeddings" }
);

productEmbeddingSchema.index({ productId: 1, embeddingModel: 1 });

export default mongoose.model("ProductEmbedding", productEmbeddingSchema);
