import fs from "fs";
import path from "path";

let prisma: any;

async function initializeDatabase() {
  if (process.env.NODE_ENV === "dev") {
    const { getPrisma: localDb } = await import("../prisma/db");
    prisma = localDb();
  } else {
    const { getPrisma: prodDb } = await import("../prisma/dbPostgres");
    prisma = prodDb();
  }
}

async function runSeeder() {
  await initializeDatabase();

  const filePath = path.resolve(__dirname, "seed_backup.json");

  // 1. Cek apakah file backup ada
  if (!fs.existsSync(filePath)) {
    console.error("❌ File backup tidak ditemukan!");
    return;
  }

  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const backup = JSON.parse(rawData);
    const { recomTarget, score } = backup.data;

    console.log("🚀 Memulai seeding data ke database...");

    // 2. Seeding RecomTarget (Menggunakan upsert karena user_key adalah @id manual)
    console.log("📥 Seeding RecomTarget...");
    for (const item of recomTarget) {
      await prisma.recomTarget.upsert({
        where: { user_key: item.user_key },
        update: { matkuls: item.matkuls },
        create: {
          user_key: item.user_key,
          matkuls: item.matkuls,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    // 3. Seeding Score
    console.log("📥 Seeding Score...");
    for (const item of score) {
      await prisma.score.upsert({
        where: { user_key: item.user_key },
        update: {
          score_cf: item.score_cf,
          score_chat: item.score_chat,
        },
        create: {
          user_key: item.user_key,
          score_cf: item.score_cf,
          score_chat: item.score_chat,
          createdAt: new Date(item.createdAt),
        },
      });
    }

    console.log("✅ Seeding selesai dengan sukses!");
  } catch (error) {
    console.error("❌ Gagal melakukan seeding:", error);
  }
}

runSeeder();