import express from "express";
import Wishlist from "../models/Wishlist.js";
const router=express.Router();
router.get("/",async(req,res,next)=>{try{res.json(await Wishlist.find({userId:req.userId}).populate("productId").sort({addedAt:-1}).lean());}catch(e){next(e);}});
router.post("/",async(req,res,next)=>{try{const item=await Wishlist.findOneAndUpdate({userId:req.userId,productId:req.body.productId},{userId:req.userId,productId:req.body.productId},{upsert:true,new:true,setDefaultsOnInsert:true});res.status(201).json(item);}catch(e){next(e);}});
router.delete("/:productId",async(req,res,next)=>{try{await Wishlist.deleteOne({userId:req.userId,productId:req.params.productId});res.json({ok:true});}catch(e){next(e);}});
export default router;
