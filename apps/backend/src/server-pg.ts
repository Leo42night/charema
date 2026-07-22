import { createApp } from "./index";
import { getPrisma } from "../prisma/dbPostgres"; // PostgreSQL
import cors from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";


const app = createApp(getPrisma);

app
  .use(cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .use(swagger())
  .listen(process.env.PORT || 3000);

console.log("🦊 Backend (local)  → http://localhost:3000");
console.log("🦊 FRONTEND_URLS →", process.env.FRONTEND_URLS); // data akses pakai env
