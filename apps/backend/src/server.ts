import { createApp } from "./index";
import { getPrisma, dbUrl } from "../prisma/db"; // LibSQL
import cors from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";


const app = createApp(getPrisma);

app
  .use(cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .use(swagger())
  .listen(3000);

console.log("🦊 Backend (local)  → http://localhost:3000");
console.log("🦊 FRONTEND_URL → process.env.FRONTEND_URL!"); // data akses pakai env
console.log("🦊 DATABASE_URL →", dbUrl);