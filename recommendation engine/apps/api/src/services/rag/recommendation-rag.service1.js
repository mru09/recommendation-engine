import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { config } from "../../config.js";

const outputSchema = z.object({
  summary: z.string(),
  recommendations: z.array(
    z.object({
      productId: z.string(),
      reason: z.string(),
      confidence: z.number().min(0).max(1)
    })
  )
});

const parser = StructuredOutputParser.fromZodSchema(outputSchema);

function fallback(rankedCandidates) {
  return {
    summary:
      "Recommendations are based on your profile, behavior, and semantic product similarity.",
    recommendations: rankedCandidates.slice(0, 30).map((item, index) => ({
      productId: item.product._id.toString(),
      reason: `Relevant to your ${item.product.category} and ${item.product.brand} interests.`,
      confidence: Math.min(0.99, Math.max(0.5, 0.9 - index * 0.01))
    }))
  };
}

export async function generateRecommendationsWithRAG(profile, rankedCandidates) {
  const fallbackResult = fallback(rankedCandidates);

  if (!rankedCandidates.length || !config.groqApiKey) {
    return fallbackResult;
  }

  const model = new ChatGroq({
    apiKey: config.groqApiKey,
    model: config.groqModel,
    temperature: 0.2
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a product recommendation assistant in a RAG pipeline.

The application has already retrieved and ranked valid products.
Use ONLY the supplied products. Never invent product IDs or products.

Use:
- explicit user categories and brands
- order history signals
- wishlist signals
- browsing behavior
- semantic vector similarity
- deterministic ranking score

Return up to 30 recommendations.
Prefer diverse but relevant products across the user's interests.
Give concise reasons grounded in the supplied context.

{formatInstructions}`
    ],
    [
      "human",
      `USER CONTEXT:
{profile}

RETRIEVED RAG CONTEXT — PRODUCTS:
{products}`
    ]
  ]);

  console.log(prompt)
  const chain = prompt.pipe(model).pipe(parser);

  try {
    const result = await chain.invoke({
      formatInstructions: parser.getFormatInstructions(),
      profile: profile.userQuery,
      products: JSON.stringify(
        rankedCandidates.slice(0, 50).map((item) => ({
          productId: item.product._id.toString(),
          name: item.product.name,
          category: item.product.category,
          brand: item.product.brand,
          tags: item.product.tags,
          description: item.product.description,
          price: item.product.price,
          rating: item.product.rating,
          vectorSimilarity: item.signals.vectorSimilarity,
          behaviorScore: item.signals.behaviorScore,
          finalScore: item.score
        }))
      )
    });

    const validIds = new Set(
      rankedCandidates.map((item) => item.product._id.toString())
    );

    const recommendations = result.recommendations
      .filter((item) => validIds.has(item.productId))
      .slice(0, 30);

    return {
      summary: result.summary,
      recommendations: recommendations.length
        ? recommendations
        : fallbackResult.recommendations
    };
  } catch (error) {
    console.error("LangChain RAG/Groq fallback:", error.message);
    return {
      summary:
        "AI explanation was unavailable, so recommendations were generated from the hybrid ranking engine.",
      recommendations: fallbackResult.recommendations
    };
  }
}
