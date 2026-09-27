import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { config } from "../apps/api/src/config.js";
import { generateProductEmbeddings } from "../apps/api/src/services/embeddings/product-embedding.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../apps/api/.env") });

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing. Create apps/api/.env from .env.example");
}

const force = process.argv.includes("--force");
await mongoose.connect(config.mongoUri);

try {
  console.log(`Embedding model: ${config.embeddingModel}`);
  console.log(`Target collection: product_embeddings`);
  console.log(`Force regeneration: ${force}`);
  const result = await generateProductEmbeddings({ force });
  console.log(`Generated: ${result.generated}`);
  console.log(`Skipped unchanged: ${result.skipped}`);
  console.log(`Total products: ${result.total}`);
} finally {
  await mongoose.disconnect();
}
