import Product from "../../models/Product.js";
import ProductEmbedding from "../../models/ProductEmbedding.js";
import { config } from "../../config.js";
import { contentHash, embedText, productToText } from "./embedding.service.js";

export async function generateProductEmbeddings({ force = false } = {}) {
  const products = await Product.find().lean();
  let count = 0;
  let skipped = 0;

  for (const product of products) {
    const text = productToText(product);
    const hash = contentHash(text);
    const existing = await ProductEmbedding.findOne({ productId: product._id }).lean();

    if (
      !force &&
      existing &&
      existing.contentHash === hash &&
      existing.embeddingModel === config.embeddingModel &&
      existing.dimensions === config.vectorDimensions
    ) {
      skipped += 1;
      continue;
    }

    const embedding = await embedText(text);

    if (embedding.length !== config.vectorDimensions) {
      throw new Error(
        `Embedding dimension mismatch. Expected ${config.vectorDimensions}, received ${embedding.length}.`
      );
    }

    await ProductEmbedding.findOneAndUpdate(
      { productId: product._id },
      {
        $set: {
          embedding,
          embeddingModel: config.embeddingModel,
          dimensions: embedding.length,
          contentHash: hash,
          updatedAt: new Date()
        },
        $setOnInsert: {
          productId: product._id,
          sourceVersion: 1,
          createdAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    count += 1;
    console.log(`Embedded ${count}: ${product.name}`);
  }

  return { generated: count, skipped, total: products.length };
}
