import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true },
    tags: [String],
    description: String,
    price: Number,
    rating: Number,
    stock: Number
  },
  { timestamps: true }
);

productSchema.index({ category: 1, brand: 1 });

export default mongoose.model("Product", productSchema);
