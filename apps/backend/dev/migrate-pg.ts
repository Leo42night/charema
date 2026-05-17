// migrasi manual dari file sql (bukan schema-pg.prisma), di sqlite bisa manual dgn `bunx prisma migrate dev --name nama_bebas`
// ! Siapkan file skema-pg.sql dulu
import { getPrisma } from "../prisma/dbPostgres";
import { readFileSync } from "fs";
import { join } from "path";

const sql = readFileSync(join(__dirname, "../sql/skema-pg.sql"), "utf-8");

const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const statement of statements) {
  await getPrisma().$executeRawUnsafe(statement);
}

await getPrisma().$disconnect();