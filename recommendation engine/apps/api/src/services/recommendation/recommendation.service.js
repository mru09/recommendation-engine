import { buildUserProfile } from "./user-profile.service.js";
import { vectorSearchProducts } from "../vector/product-vector-search.service.js";
import { rankCandidates } from "./ranking.service.js";
import { generateRecommendationsWithRAG } from "../rag/recommendation-rag.service.js";
import Product from "../../models/Product.js";

export async function getRecommendations(userId) {
  const profile = await buildUserProfile(userId);
  let vectorCandidates;
  try {
    vectorCandidates = await vectorSearchProducts(profile.userQuery, 50);
  } catch (error) {
    console.warn("Vector search unavailable; falling back to deterministic product candidates:", error.message);
    vectorCandidates = await Product.find().sort({ rating: -1 }).limit(150).lean();
  }
  const ranked = rankCandidates(vectorCandidates, profile);
  const ai = await generateRecommendationsWithRAG(profile, ranked);
  const ids = ai.recommendations.map(x => x.productId);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  return {
    profile: { categories: profile.categories, brands: profile.brands, tags: profile.tags },
    summary: ai.summary,
    recommendations: ai.recommendations.map((r, index) => ({
      position: index + 1,
      ...r,
      product: productMap.get(r.productId)
    })).filter(r => r.product)
  };
}
