import express from "express";
import { getRecommendations } from "../services/recommendation/recommendation.service.js";
const router=express.Router();
router.get("/",async(req,res,next)=>{try{res.json(await getRecommendations(req.userId));}catch(e){next(e);}});
export default router;
