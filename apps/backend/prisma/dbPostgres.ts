// AWS Lambda tidak bisa langsung menggunakan file SQLite, jadi kita buat file baru khusus untuk PostgreSQL yang akan digunakan di Lambda. 
// File ini akan tetap menggunakan Prisma Client dengan skema PostgreSQL.
import { PrismaClient } from "../src/generated/prisma-pg/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const ca = fs.readFileSync(
  path.join(process.cwd(), "cert/global-bundle.pem")
).toString();

// Kita buat singleton Prisma Client agar dipanggil ketika SSM sudah siap, dan tidak dibuat ulang setiap kali handler dipanggil (karena Lambda bisa reuse container).
let prisma: PrismaClient;

export const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
        ssl: {
          ca, // lokasi file sertifikat SSL untuk RDS, ketika build akan relatif ke folder /apps/backend/dist-lambda/
          rejectUnauthorized: true,
        }
      }),
    });
  }

  return prisma;
};