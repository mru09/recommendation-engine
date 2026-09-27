export function rankCandidates(candidates, profile) {
  const purchasedIds = new Set(profile.orders.map(x => x.productId?._id?.toString()).filter(Boolean));
  const wishlistedIds = new Set(profile.wishlist.map(x => x.productId?._id?.toString()).filter(Boolean));
  const viewedIds = new Set(profile.browsing.map(x => x.productId?._id?.toString()).filter(Boolean));
  const categoryScores = Object.fromEntries(profile.categories.map(x => [x.name, x.score]));
  const brandScores = Object.fromEntries(profile.brands.map(x => [x.name, x.score]));
  const tagScores = Object.fromEntries(profile.tags.map(x => [x.name, x.score]));

  return candidates
    .filter(p => !purchasedIds.has(p._id.toString()))
    .map(product => {
      const category = categoryScores[product.category] || 0;
      const brand = brandScores[product.brand] || 0;
      const tag = (product.tags || []).reduce((sum, t) => sum + (tagScores[t] || 0), 0);
      const vector = Math.max(0, Number(product.vectorScore || 0));
      const behaviorBonus = wishlistedIds.has(product._id.toString()) ? 4 : viewedIds.has(product._id.toString()) ? 2 : 0;
      const rating = Math.min(20, Number(product.rating || 0) * 4);
      const score = vector * 50 + Math.min(category * 2, 50) + Math.min(brand, 20) + Math.min(tag, 25) + behaviorBonus + rating;
      return {
        product,
        score,
        signals: { vectorSimilarity: vector, categoryScore: category, brandScore: brand, tagScore: tag, behaviorBonus, rating }
      };
    })
    .sort((a,b) => b.score - a.score)
    .slice(0, 50);
}
