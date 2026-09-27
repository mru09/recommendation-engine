import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  personaKey: String,
  preferences: {
    categories: [String],
    brands: [String]
  }
}, { timestamps: true });
export default mongoose.model("User", schema);
