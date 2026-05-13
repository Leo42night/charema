import { createApp } from "./index";
import { getPrisma, dbUrl } from "../prisma/db"; // LibSQL
import cors from "@elysiajs/cors";

const app = createApp(getPrisma);

app.use(cors({
  origin: "*",
  allowedHeaders: ["Content-Type", "Authorization"],
}))
.listen(3000);

console.log("🦊 Backend (local)  → http://localhost:3000");
console.log("🦊 FRONTEND_URL (local) → http://localhost:5173");
console.log("🦊 DATABASE_URL →", dbUrl);