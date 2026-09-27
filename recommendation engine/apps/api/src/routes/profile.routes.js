import express from "express";
import User from "../models/User.js";
const router=express.Router();
router.get("/",async(req,res,next)=>{try{res.json(await User.findById(req.userId).select("name email preferences").lean());}catch(e){next(e);}});
router.patch("/",async(req,res,next)=>{try{const clean=a=>[...new Set((Array.isArray(a)?a:[]).map(x=>String(x).trim()).filter(Boolean))];const user=await User.findByIdAndUpdate(req.userId,{$set:{"preferences.categories":clean(req.body.categories),"preferences.brands":clean(req.body.brands)}},{new:true}).select("name email preferences").lean();res.json(user);}catch(e){next(e);}});
export default router;
