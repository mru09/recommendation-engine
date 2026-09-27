import app from "./app.js";
import { connectDb } from "./db.js";
import { config } from "./config.js";
await connectDb();
app.listen(config.port,()=>console.log(`API running on http://localhost:${config.port}`));
