import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
const router = express.Router();
router.get("/", async(req,res,next)=>{try{res.json(await Order.find({userId:req.userId}).populate("productId").sort({orderedAt:-1}).lean());}catch(e){next(e);}});
router.post("/", async(req,res,next)=>{try{const p=await Product.findById(req.body.productId);if(!p)return res.status(404).json({message:"Product not found"});const o=await Order.create({userId:req.userId,productId:p._id,quantity:Number(req.body.quantity||1),price:p.price});res.status(201).json(o);}catch(e){next(e);}});
export default router;
