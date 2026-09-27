import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "local-dev-secret-change-me",
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  embeddingModel: process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
  vectorIndexName: process.env.VECTOR_INDEX_NAME || "product_vector_index",
  vectorDimensions: Number(process.env.VECTOR_DIMENSIONS || 384)
};
