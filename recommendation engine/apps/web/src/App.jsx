import React from "react";
import {Routes,Route,Link,Navigate,useNavigate} from "react-router-dom";
import {logout,user} from "./api";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Recommendations from "./pages/Recommendations";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import Browsing from "./pages/Browsing";
function Shell(){const nav=useNavigate();const u=user();if(!u)return <Navigate to="/login" replace/>;return <div><header><strong>AI Shop</strong><nav><Link to="/products">Products</Link><Link to="/recommendations">Recommendations</Link><Link to="/orders">Orders</Link><Link to="/wishlist">Wishlist</Link><Link to="/browsing">Browsing</Link><Link to="/profile">Profile</Link></nav><button onClick={()=>{logout();nav("/login")}}>Logout</button></header><main><Routes><Route path="/products" element={<Products/>}/><Route path="/recommendations" element={<Recommendations/>}/><Route path="/orders" element={<Orders/>}/><Route path="/wishlist" element={<Wishlist/>}/><Route path="/browsing" element={<Browsing/>}/><Route path="/profile" element={<Profile/>}/><Route path="*" element={<Navigate to="/recommendations"/>}/></Routes></main></div>}
export default function App(){return <Routes><Route path="/login" element={<Login/>}/><Route path="/*" element={<Shell/>}/></Routes>}
