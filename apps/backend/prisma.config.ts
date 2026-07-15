import { defineConfig } from "prisma/config";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const schema = dbUrl.startsWith("postgre") ? "prisma/schema-pg.prisma" : "prisma/schema.prisma";

// --- LOG UNTUK DEBUGGING ---
// console.log("==========================================");
// console.log("DATABASE_URL :", dbUrl);
// console.log("Skema        :", schema);
// console.log("==========================================");

export default defineConfig({
  schema: schema,
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts"
  },
  datasource: {
    url: dbUrl,
  },
});