import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Wishlist from "../../models/Wishlist.js";
import BrowsingHistory from "../../models/BrowsingHistory.js";

const behaviorWeight = { PURCHASE: 10, ADD_TO_CART: 7, WISHLIST: 5, CLICK: 3, SEARCH: 2, VIEW: 1 };

export async function buildUserProfile(userId) {
  const [user, orders, wishlist, browsing] = await Promise.all([
    User.findById(userId).lean(),
    Order.find({ userId }).populate("productId").sort({ orderedAt: -1 }).lean(),
    Wishlist.find({ userId }).populate("productId").sort({ addedAt: -1 }).lean(),
    BrowsingHistory.find({ userId }).populate("productId").sort({ createdAt: -1 }).limit(100).lean()
  ]);
  if (!user) throw new Error("User not found");

  const categoryScores = {}, brandScores = {}, tagScores = {};
  const addProduct = (product, weight) => {
    if (!product) return;
    if (product.category) categoryScores[product.category] = (categoryScores[product.category] || 0) + weight;
    if (product.brand) brandScores[product.brand] = (brandScores[product.brand] || 0) + weight;
    for (const tag of product.tags || []) tagScores[tag] = (tagScores[tag] || 0) + weight;
  };

  for (const c of user.preferences?.categories || []) categoryScores[c] = (categoryScores[c] || 0) + 8;
  for (const b of user.preferences?.brands || []) brandScores[b] = (brandScores[b] || 0) + 5;
  orders.forEach(x => addProduct(x.productId, 10));
  wishlist.forEach(x => addProduct(x.productId, 6));
  browsing.forEach(x => addProduct(x.productId, behaviorWeight[x.eventType] || 1));

  const categories = Object.entries(categoryScores).sort((a,b) => b[1]-a[1]).map(([name, score]) => ({ name, score }));
  const brands = Object.entries(brandScores).sort((a,b) => b[1]-a[1]).map(([name, score]) => ({ name, score }));
  const tags = Object.entries(tagScores).sort((a,b) => b[1]-a[1]).map(([name, score]) => ({ name, score }));

  const userQuery = [
    `User: ${user.name}`,
    `Preferred categories: ${(user.preferences?.categories || []).join(", ")}`,
    `Preferred brands: ${(user.preferences?.brands || []).join(", ")}`,
    `Behavioral category interests: ${categories.slice(0, 8).map(x => `${x.name} (${x.score})`).join(", ")}`,
    `Behavioral brand interests: ${brands.slice(0, 8).map(x => `${x.name} (${x.score})`).join(", ")}`,
    `Important tags: ${tags.slice(0, 12).map(x => `${x.name} (${x.score})`).join(", ")}`,
    `Recent purchases: ${orders.slice(0, 8).map(x => x.productId?.name).filter(Boolean).join(", ")}`,
    `Recent wishlist: ${wishlist.slice(0, 8).map(x => x.productId?.name).filter(Boolean).join(", ")}`,
    `Recent browsing: ${browsing.slice(0, 15).map(x => x.productId?.name).filter(Boolean).join(", ")}`
  ].join("\n");

  return { user, orders, wishlist, browsing, categories, brands, tags, userQuery };
}
