import { pipeline } from "@huggingface/transformers";
import { createHash } from "crypto";
import { config } from "../../config.js";

let extractorPromise;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      config.embeddingModel,
      { dtype: "fp32" }
    );
  }
  return extractorPromise;
}

export async function embedText(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export function productToText(product) {
  return [
    `Product: ${product.name}`,
    `Category: ${product.category}`,
    `Brand: ${product.brand}`,
    `Tags: ${(product.tags || []).join(", ")}`,
    `Description: ${product.description || ""}`,
    `Price: ${product.price ?? ""}`,
    `Rating: ${product.rating ?? ""}`
  ].join("\n");
}

export function contentHash(text) {
  return createHash("sha256").update(text).digest("hex");
}
