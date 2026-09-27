import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../apps/api/src/models/User.js";
import Product from "../apps/api/src/models/Product.js";
import Order from "../apps/api/src/models/Order.js";
import Wishlist from "../apps/api/src/models/Wishlist.js";
import BrowsingHistory from "../apps/api/src/models/BrowsingHistory.js";
import RecommendationEvent from "../apps/api/src/models/RecommendationEvent.js";
import ProductEmbedding from "../apps/api/src/models/ProductEmbedding.js";

const __filename=fileURLToPath(import.meta.url);const __dirname=path.dirname(__filename);
dotenv.config({path:path.resolve(__dirname,"../apps/api/.env")});
if(!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing. Create apps/api/.env from .env.example");
await mongoose.connect(process.env.MONGODB_URI);

const categories=["Sports","Footwear","Fitness","Electronics","Audio","Mobile","Gaming","Accessories","Fashion","Beauty","Skincare","Home","Furniture","Kitchen","Photography","Laptops","Office"];
const brands=["Nike","Adidas","Samsung","Sony","Apple","JBL","Logitech","Puma","OnePlus","Dell","Canon","Philips","IKEA","HP","Lenovo"];
const tagPool=["running","training","wireless","smart","premium","budget","gaming","fitness","travel","work","home","portable","lightweight","comfortable","durable","daily-use"];
const productTemplates=[
 ["Footwear","running shoes","performance running shoes"],["Sports","training gear","training equipment"],["Fitness","fitness tracker","fitness tracking device"],["Electronics","smart device","smart everyday electronics"],["Audio","wireless headphones","wireless audio device"],["Mobile","smartphone","modern smartphone"],["Gaming","gaming accessory","gaming equipment"],["Accessories","everyday accessory","versatile accessory"],["Fashion","casual wear","comfortable fashion item"],["Beauty","beauty care","daily beauty product"],["Skincare","skin care","daily skincare product"],["Home","home essential","practical home product"],["Furniture","home furniture","modern furniture"],["Kitchen","kitchen appliance","useful kitchen product"],["Photography","camera gear","photography equipment"],["Laptops","laptop","productivity laptop"],["Office","office accessory","workplace accessory"]
];
const pick=(a,i)=>a[i%a.length];
const personaFor=i=>i%5===0?{categories:["Electronics","Audio","Mobile"],brands:["Samsung","Sony","Apple"]}:i%5===1?{categories:["Sports","Footwear","Fitness"],brands:["Nike","Adidas","Puma"]}:i%5===2?{categories:["Home","Furniture","Kitchen"],brands:["IKEA","Philips"]}:i%5===3?{categories:["Gaming","Laptops","Office"],brands:["Dell","Lenovo","Logitech"]}:{categories:["Fashion","Beauty","Skincare"],brands:["Puma","Philips"]};

await Promise.all([RecommendationEvent.deleteMany({}),BrowsingHistory.deleteMany({}),Wishlist.deleteMany({}),Order.deleteMany({}),ProductEmbedding.deleteMany({}),Product.deleteMany({}),User.deleteMany({})]);
const users=[];
for(let i=1;i<=50;i++){const p=personaFor(i);users.push({name:`Demo User ${i}`,email:`demo.user.${i}@recommendation.local`,personaKey:`persona-${(i%5)+1}`,preferences:p});}
const userDocs=await User.insertMany(users);
const products=[];
for(let i=1;i<=200;i++){const t=productTemplates[(i-1)%productTemplates.length];const category=t[0];const brand=pick(brands,i*7);const tags=[t[1],pick(tagPool,i+2),pick(tagPool,i+5)].filter((x,j,a)=>a.indexOf(x)===j);products.push({name:`${brand} ${t[1].replace(/\b\w/g,c=>c.toUpperCase())} ${i}`,category,brand,tags,description:`${brand} ${t[2]} designed for ${tags.join(", ")}.`,price:Math.round((25+(i*37)%900)*10)/10,rating:Math.round((3.5+((i*13)%15)/10)*10)/10,stock:20+(i%80)});}
const productDocs=await Product.insertMany(products);
const orders=[];const wish=[];const browsing=[];
for(let i=0;i<200;i++){const u=userDocs[i%50];const p=productDocs[(i*7+3)%200];orders.push({userId:u._id,productId:p._id,quantity:1+(i%2),price:p.price,orderedAt:new Date(Date.now()-i*86400000)});}
for(let i=0;i<200;i++){const u=userDocs[(i*3+5)%50];const p=productDocs[(i*11+9)%200];wish.push({userId:u._id,productId:p._id,addedAt:new Date(Date.now()-i*43200000)});}
const events=["VIEW","VIEW","VIEW","CLICK","SEARCH","ADD_TO_CART","WISHLIST"];
for(let i=0;i<1400;i++){const u=userDocs[(i*17+2)%50];const p=productDocs[(i*19+7)%200];browsing.push({userId:u._id,productId:p._id,eventType:pick(events,i),sessionId:`seed-session-${i%100}`,createdAt:new Date(Date.now()-i*3600000),metadata:{source:"seed"}});}
await Order.insertMany(orders);await Wishlist.insertMany(wish);await BrowsingHistory.insertMany(browsing);
console.log(`Seeded ${userDocs.length} users, ${productDocs.length} products, ${orders.length} orders, ${wish.length} wishlist items, ${browsing.length} browsing events.`);
console.log("Demo login: demo.user.1@recommendation.local");
await mongoose.disconnect();
