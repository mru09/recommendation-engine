import express from "express";
import RecommendationEvent from "../models/RecommendationEvent.js";
const router=express.Router();
router.post("/",async(req,res,next)=>{try{const event=await RecommendationEvent.create({userId:req.userId,productId:req.body.productId,eventType:req.body.eventType,recommendationSource:req.body.recommendationSource||"HYBRID",recommendationScore:req.body.recommendationScore,position:req.body.position,reason:req.body.reason,sessionId:req.body.sessionId,metadata:req.body.metadata});res.status(201).json(event);}catch(e){next(e);}});
export default router;
