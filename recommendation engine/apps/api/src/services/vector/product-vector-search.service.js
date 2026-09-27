import { config } from "../../config.js";
import ProductEmbedding from "../../models/ProductEmbedding.js";
import { embedText } from "../embeddings/embedding.service.js";

export async function vectorSearchProducts(userQuery, limit = 50) {
  const queryVector = await embedText(userQuery);

  const results = await ProductEmbedding.aggregate([
    {
      $vectorSearch: {
        index: config.vectorIndexName,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(100, limit * 5),
        limit
      }
    },
    {
      $project: {
        productId: 1,
        vectorScore: { $meta: "vectorSearchScore" }
      }
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: "$product._id",
        name: "$product.name",
        category: "$product.category",
        brand: "$product.brand",
        tags: "$product.tags",
        description: "$product.description",
        price: "$product.price",
        rating: "$product.rating",
        stock: "$product.stock",
        vectorScore: 1
      }
    }
  ]);

  return results;
}
