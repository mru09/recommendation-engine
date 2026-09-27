# Scripts

Run these commands from the project root.

## 1. Seed MongoDB

```bash
npm run seed
```

Creates the demo users, products, orders, wishlist records, browsing events, and clears old product embeddings.

## 2. Generate product embeddings

```bash
npm run embed:products
```

For a complete regeneration:

```bash
npm run embed:products -- --force
```

Embeddings are stored in the `product_embeddings` collection, not in `products`.

## 3. MongoDB Atlas Vector Search

Use `mongodb-vector-index.json` to create the `product_vector_index` on the `product_embeddings` collection.
