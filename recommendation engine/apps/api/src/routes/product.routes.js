import express from "express";
import Product from "../models/Product.js";
const router = express.Router();
router.get("/", async (req,res,next) => { try { const limit = Math.min(Number(req.query.limit || 200), 200); res.json(await Product.find().sort({ name: 1 }).limit(limit).lean()); } catch(e){ next(e); } });
router.get("/:id", async (req,res,next) => { try { const p = await Product.findById(req.params.id).lean(); if(!p) return res.status(404).json({message:"Product not found"}); res.json(p); } catch(e){next(e);} });
export default router;
