import express from "express";
import BrowsingHistory from "../models/BrowsingHistory.js";
const router=express.Router();
router.get("/",async(req,res,next)=>{try{res.json(await BrowsingHistory.find({userId:req.userId}).populate("productId").sort({createdAt:-1}).limit(200).lean());}catch(e){next(e);}});
router.post("/",async(req,res,next)=>{try{const x=await BrowsingHistory.create({userId:req.userId,productId:req.body.productId,eventType:req.body.eventType||"VIEW",sessionId:req.body.sessionId,metadata:{source:"products-page"}});res.status(201).json(x);}catch(e){next(e);}});
export default router;
