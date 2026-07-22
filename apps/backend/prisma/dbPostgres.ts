import { PrismaClient } from "../src/generated/prisma-pg/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const certPath = path.join(process.cwd(), "cert/server-ca.pem");
console.log("File exists:", fs.existsSync(certPath));

const password = encodeURIComponent(process.env.DB_PASS!);
const useSsl = process.env.DB_USE_SSL === "true";

const host = useSsl ? process.env.DB_HOST : "localhost";
const socketParam = useSsl
  ? ""
  : `?host=/cloudsql/${process.env.PROJECT_ID}:us-central1:${process.env.INSTANCE_ID}`;

const url = `postgresql://postgres:${password}@${host}:5432/postgres${socketParam}`;
// console.log("DB_URL (clean pw)", url);

let prisma: PrismaClient;

export const getPrisma = () => {
  if (!prisma) {
    const config: ConstructorParameters<typeof PrismaPg>[0] = {
      connectionString: url,
    };

    if (useSsl) {
      const certPath = path.join(process.cwd(), "cert/server-ca.pem");
      config.ssl = {
        ca: fs.readFileSync(certPath).toString(),
        rejectUnauthorized: true,
      };
    }

    prisma = new PrismaClient({
      adapter: new PrismaPg(config),
    });
  }

  return prisma;
};