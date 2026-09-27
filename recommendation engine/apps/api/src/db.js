import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb() {
  if (!config.mongoUri) throw new Error("MONGODB_URI is missing. Add it to apps/api/.env");
  await mongoose.connect(config.mongoUri);
  console.log("MongoDB connected");
}
