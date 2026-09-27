import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config.js";
const router = express.Router();
router.post("/login", async (req,res,next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ message: "User not found. Use a seeded demo email." });
    const token = jwt.sign({ userId: user._id.toString() }, config.jwtSecret, { expiresIn: "1d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences } });
  } catch(e) { next(e); }
});
export default router;
