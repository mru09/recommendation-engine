# AI Product Recommendation Engine — Hybrid Vector RAG + LangChain + Groq

A practical ecommerce recommendation POC using:

- React + Vite
- Node.js + Express
- MongoDB Atlas
- MongoDB Atlas Vector Search
- A separate `product_embeddings` collection
- Local `all-MiniLM-L6-v2` embeddings (384 dimensions)
- LangChain
- Groq / Llama
- Behavioral recommendation signals
- Recommendation event tracking

## Architecture

```text
                         MongoDB Atlas
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
       products             users          user behavior
                                            │
                                  Orders / Wishlist /
                                  Browsing History
          │                   │                    │
          │                   └────────┬───────────┘
          │                            ↓
          │                    User Profile Builder
          │                            ↓
          │                    Semantic User Query
          │                            ↓
          │                    Embedding Model
          │                            ↓
          │                product_embeddings collection
          │                            ↓
          │                 MongoDB Vector Search
          │                            ↓
          └────────────────────── Top 50 product IDs
                                       ↓
                              Product lookup / join
                                       ↓
                             Hybrid Ranking Service
                                       ↓
                                  Top candidates
                                       ↓
                              LangChain RAG pipeline
                                       ↓
                                  Groq / Llama
                                       ↓
                             Structured JSON output
                                       ↓
                                30 recommendations
                                       ↓
                              React Recommendations
                                       ↓
                            RecommendationEvent
```

## Important data-model decision

Product business data and AI vector data are intentionally separated.

### `products`

Contains only ecommerce/product fields:

```text
_id
name
category
brand
tags
description
price
rating
stock
```

### `product_embeddings`

Contains AI/search infrastructure fields:

```text
_id
productId
embedding
embeddingModel
dimensions
contentHash
sourceVersion
createdAt
updatedAt
```

`productId` references `products._id`.

This makes it easier to change embedding models, regenerate vectors, version embedding content, and keep product documents clean.

## Folder structure

```text
product-recommendation-engine-rag/
│
├── apps/
│   ├── api/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── src/
│   │       ├── models/
│   │       │   ├── User.js
│   │       │   ├── Product.js
│   │       │   ├── ProductEmbedding.js
│   │       │   ├── Order.js
│   │       │   ├── Wishlist.js
│   │       │   ├── BrowsingHistory.js
│   │       │   └── RecommendationEvent.js
│   │       │
│   │       ├── services/
│   │       │   ├── embeddings/
│   │       │   │   ├── embedding.service.js
│   │       │   │   └── product-embedding.service.js
│   │       │   │
│   │       │   ├── vector/
│   │       │   │   └── product-vector-search.service.js
│   │       │   │
│   │       │   ├── recommendation/
│   │       │   │   ├── user-profile.service.js
│   │       │   │   ├── ranking.service.js
│   │       │   │   └── recommendation.service.js
│   │       │   │
│   │       │   └── ai/
│   │       │       └── groq.service.js
│   │       │
│   │       └── routes/
│   │           └── recommendation-event.routes.js
│   │
│   └── web/
│
├── scripts/
│   ├── seed.js
│   ├── generate-product-embeddings.js
│   └── mongodb-vector-index.json
│
└── README.md
```

## 1. Install

From the project root:

```bash
npm install
```

Copy:

```text
apps/api/.env.example → apps/api/.env
```

Set:

```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_local_secret
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
VECTOR_INDEX_NAME=product_vector_index
VECTOR_DIMENSIONS=384
CORS_ORIGIN=http://localhost:5173
```

The embedding model runs locally. No embedding API key is required.

## 2. Seed MongoDB

Run:

```bash
npm run seed
```

The seed clears only the application collections and creates:

- 50 users
- 200 products
- 200 orders
- 200 wishlist records
- 1,400 browsing events
- multiple profile categories/brands

It also clears `product_embeddings`, because the product IDs are recreated during a fresh seed.

Demo login:

```text
demo.user.1@recommendation.local
```

No password is required for this POC.

## 3. Generate product embeddings

After the seed completes:

```bash
npm run embed:products
```

The script:

1. Reads products from `products`.
2. Builds a semantic product document from name/category/brand/tags/description/price/rating.
3. Generates a 384-dimensional embedding with `all-MiniLM-L6-v2`.
4. Stores the vector in `product_embeddings`.
5. Stores the embedding model and dimensions.
6. Stores a SHA-256 `contentHash`.
7. Skips unchanged products on later runs.

To regenerate every vector:

```bash
npm run embed:products -- --force
```

The collection should look conceptually like:

```json
{
  "productId": "...",
  "embedding": [0.012, -0.034, 0.056],
  "embeddingModel": "sentence-transformers/all-MiniLM-L6-v2",
  "dimensions": 384,
  "contentHash": "...",
  "sourceVersion": 1
}
```

## 4. Create MongoDB Atlas Vector Search index

Create the Vector Search index on the **`product_embeddings` collection**, not the `products` collection.

Use `scripts/mongodb-vector-index.json`.

The index must be named:

```text
product_vector_index
```

Configuration:

```text
path: embedding
numDimensions: 384
similarity: cosine
```

The vector index therefore searches this collection:

```text
product_embeddings
```

not:

```text
products
```

The application then uses `productId` from the vector result to retrieve the actual product data.

## 5. Start the API

```bash
npm run dev:api
```

API:

```text
http://localhost:5000
```

## 6. Start the React application

In another terminal:

```bash
npm run dev:web
```

Normally:

```text
http://localhost:5173
```

## How the RAG recommendation flow works

### Step 1 — User behavior

The application reads:

```text
Orders
Wishlist
Browsing History
Profile categories
Profile brands
```

### Step 2 — User profile

`user-profile.service.js` converts these signals into weighted interests.

For example:

```text
Footwear: 34
Fitness: 27
Electronics: 19
Nike: 31
Adidas: 22
running: 38
training: 24
```

It also builds a semantic query such as:

```text
Preferred categories: Footwear, Fitness, Electronics
Preferred brands: Nike, Adidas
Behavioral interests: running, training, wireless
Recent purchases: Nike Running Shoes
Recent browsing: Fitness Tracker, Running Shoes
```

### Step 3 — User query embedding

The semantic query is converted into a vector using the same embedding model used for products.

```text
User interest text
      ↓
all-MiniLM-L6-v2
      ↓
384-dimensional vector
```

### Step 4 — Vector retrieval

MongoDB Atlas searches:

```text
product_embeddings.embedding
```

and returns the most semantically similar product IDs.

The retrieval service then performs a `$lookup` into `products` so the ranking engine receives complete product documents.

### Step 5 — Hybrid ranking

The ranking engine combines:

```text
Vector similarity
Category interest
Brand interest
Tag interest
Wishlist behavior
Browsing behavior
Product rating
```

The result is a ranked set of valid product candidates.

### Step 6 — LangChain RAG

The ranked products become the retrieved context for LangChain.

Conceptually:

```text
User Profile
     +
Retrieved Products
     ↓
LangChain Prompt
     ↓
ChatGroq
     ↓
Structured Output Parser
     ↓
JSON
```

Groq is explicitly instructed to use only the supplied product IDs.

It does not invent products.

### Step 7 — 30 recommendations

The backend validates the returned IDs against the ranked candidates and returns up to 30 recommendations.

Each recommendation contains:

```text
productId
reason
confidence
position
product
```

## Recommendation events

The UI can record:

```text
RECOMMENDATION_SHOWN
RECOMMENDATION_CLICKED
RECOMMENDATION_WISHLISTED
RECOMMENDATION_PURCHASED
RECOMMENDATION_DISMISSED
```

These are stored separately in:

```text
recommendation_events
```

This creates a feedback loop that can later be used for recommendation evaluation and ranking improvements.

## Why the architecture separates embeddings

This project intentionally does **not** put vectors inside `products`.

Benefits:

1. Product documents remain clean.
2. Embedding models can change independently.
3. Embeddings can be regenerated without rewriting product data.
4. Model version and dimensions can be tracked.
5. Content hashes make incremental embedding generation possible.
6. Multiple embedding strategies can be introduced later.
7. Vector-search infrastructure is isolated from business data.

## Production evolution

For a larger production system, the next steps could include:

- asynchronous embedding jobs through Kafka/SQS/RabbitMQ
- embedding generation on product create/update events
- multiple embedding model versions
- A/B testing ranking formulas
- recommendation CTR/conversion metrics
- collaborative filtering from user-item interactions
- offline evaluation datasets
- feature store / feature engineering
- recommendation caching
- ANN/vector search tuning
- reranking models
- explicit negative feedback
- recommendation diversity constraints
- monitoring for embedding drift and model quality

## Interview explanation

A concise way to describe the architecture:

> I built a hybrid ecommerce recommendation engine. Product metadata is embedded into a separate MongoDB `product_embeddings` collection. User behavior is converted into a semantic query, embedded with the same model, and used with MongoDB Atlas Vector Search to retrieve relevant products. A deterministic ranking layer combines semantic similarity with behavioral signals such as purchases, wishlist activity, browsing, category and brand preferences. LangChain then orchestrates a RAG prompt using those retrieved products, and Groq generates structured explanations and confidence values. Recommendation events are tracked separately to create a feedback loop for future ranking improvements.


## Project structure

```text
product-recommendation-engine-rag/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── models/
│   │       │   ├── Product.js
│   │       │   ├── ProductEmbedding.js
│   │       │   └── RecommendationEvent.js
│   │       ├── services/
│   │       │   ├── embeddings/
│   │       │   ├── vector/
│   │       │   ├── recommendation/
│   │       │   └── rag/
│   │       │       └── recommendation-rag.service.js
│   │       └── routes/
│   └── web/
├── scripts/
│   ├── seed.js
│   ├── generate-product-embeddings.js
│   ├── mongodb-vector-index.json
│   └── README.md
├── package.json
└── README.md
```
