import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { config } from "../../config.js";

function createFallback(rankedCandidates) {
  return {
    summary:
      "Recommendations are based on your profile, behavior, and semantic product similarity.",

    recommendations: rankedCandidates
      .slice(0, 30)
      .map((item, index) => ({
        productId: item.product._id.toString(),

        reason:
          `Matches your ${item.product.category} interests and recent behavior.`,

        confidence: Math.min(
          0.99,
          Math.max(0.5, 0.9 - index * 0.01)
        )
      }))
  };
}

function extractJson(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Empty LLM response");
  }

  let cleaned = text.trim();

  // Remove markdown JSON fences if the model adds them
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");

  if (firstBrace === -1) {
    throw new Error("No JSON object found in LLM response");
  }

  const lastBrace = cleaned.lastIndexOf("}");

  if (lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Incomplete JSON returned by LLM");
  }

  cleaned = cleaned.substring(
    firstBrace,
    lastBrace + 1
  );

  return JSON.parse(cleaned);
}

export async function generateRecommendationsWithRAG(
  profile,
  rankedCandidates
) {
  const fallbackResult =
    createFallback(rankedCandidates);

  if (!rankedCandidates?.length) {
    return fallbackResult;
  }

  if (!config.groqApiKey) {
    console.warn(
      "[RAG] GROQ_API_KEY is not configured. Using fallback recommendations."
    );

    return fallbackResult;
  }

  try {
    const model = new ChatGroq({
      apiKey: config.groqApiKey,
      model: config.groqModel,
      temperature: 0.1,
      maxTokens: 6000
    });

    /*
     * IMPORTANT:
     *
     * ChatPromptTemplate treats { and } as template syntax.
     *
     * Therefore the JSON example below MUST use:
     *
     * {{ ... }}
     *
     * instead of:
     *
     * { ... }
     */

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `
You are an ecommerce recommendation engine.

The application has already performed:

1. User profile analysis
2. Behavioral analysis
3. MongoDB Atlas vector search
4. Product ranking

You must select products ONLY from the supplied product list.

IMPORTANT:

- Never invent a productId.
- Return maximum 30 products.
- Return fewer if there are not enough relevant products.
- Consider multiple categories.
- Prioritize explicit user preferences.
- Consider orders, wishlist and browsing history.
- Keep each reason under 15 words.
- confidence must be between 0 and 1.

CRITICAL OUTPUT RULE:

Return ONLY valid JSON.

DO NOT use Markdown.
DO NOT use \`\`\`json.
DO NOT add any explanation before or after the JSON.

The response MUST have exactly this structure:

{{
  "summary": "short summary",
  "recommendations": [
    {{
      "productId": "existing product id",
      "reason": "short reason",
      "confidence": 0.95
    }}
  ]
}}
        `
      ],
      [
        "human",
        `
USER PROFILE:

{profile}

RETRIEVED PRODUCTS:

{products}

Generate the recommendations now.
        `
      ]
    ]);

    const candidatesForLLM =
      rankedCandidates.slice(0, 50);

    const chain = prompt.pipe(model);

    const response = await chain.invoke({
      profile:
        profile.userQuery ||
        JSON.stringify(profile),

      products: JSON.stringify(
        candidatesForLLM.map((item) => ({
          productId:
            item.product._id.toString(),

          name:
            item.product.name,

          category:
            item.product.category,

          brand:
            item.product.brand,

          tags:
            item.product.tags,

          description:
            item.product.description,

          price:
            item.product.price,

          rating:
            item.product.rating,

          vectorSimilarity:
            item.signals?.vectorSimilarity ?? 0,

          behaviorScore:
            item.signals?.behaviorScore ?? 0,

          finalScore:
            item.score ?? 0
        }))
      )
    });

    const rawContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    console.log(
      "[RAG] Groq response length:",
      rawContent.length
    );

    console.log(
      "[RAG] Groq response preview:",
      rawContent.substring(0, 500)
    );

    const parsed =
      extractJson(rawContent);

    if (
      !parsed ||
      !Array.isArray(parsed.recommendations)
    ) {
      throw new Error(
        "Groq response does not contain recommendations array"
      );
    }

    /*
     * Only allow product IDs that actually came
     * from MongoDB/vector search.
     */
    const validProductIds = new Set(
      candidatesForLLM.map((item) =>
        item.product._id.toString()
      )
    );

    const recommendations =
      parsed.recommendations
        .filter((item) => {
          return (
            item &&
            typeof item.productId === "string" &&
            validProductIds.has(item.productId)
          );
        })
        .map((item) => ({
          productId:
            item.productId,

          reason:
            typeof item.reason === "string"
              ? item.reason
              : "Matches your interests and behavior.",

          confidence:
            typeof item.confidence === "number"
              ? Math.min(
                  1,
                  Math.max(0, item.confidence)
                )
              : 0.8
        }))
        .slice(0, 30);

    if (!recommendations.length) {
      throw new Error(
        "Groq returned no valid product recommendations"
      );
    }

    console.log(
      `[RAG] Groq returned ${recommendations.length} valid recommendations`
    );

    return {
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : fallbackResult.summary,

      recommendations
    };
  } catch (error) {
    console.error(
      "[RAG] LangChain/Groq failed. Using fallback recommendations.",
      error?.message || error
    );

    return fallbackResult;
  }
}