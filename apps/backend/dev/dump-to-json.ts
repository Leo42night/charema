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

async function dumpData() {
  try {
    await initializeDatabase();
    console.log("🚀 Memulai proses dump data...");

    // 1. Ambil semua data dari setiap model secara paralel
    const [recomTargets, scores] = await Promise.all([
      prisma.recomTarget.findMany(),
      prisma.score.findMany(),
    ]);

    // 2. Gabungkan dalam satu objek
    const fullBackup = {
      timestamp: new Date().toISOString(),
      data: {
        recomTarget: recomTargets,
        score: scores,
      }
    };

    // 3. Tentukan lokasi penyimpanan
    const filePath = path.resolve(__dirname, "seed_backup.json");

    // 4. Tulis ke file JSON
    fs.writeFileSync(filePath, JSON.stringify(fullBackup, null, 2), "utf-8");

    console.log(`✅ Berhasil! Data disimpan di: ${filePath}`);
    console.log(`📊 Statistik: 
       - RecomTarget: ${recomTargets.length} baris
       - Score: ${scores.length} baris`
      );

  } catch (error) {
    console.error("❌ Terjadi kesalahan saat dump data:", error);
  } finally {
    // Karena libSQL adapter mungkin butuh waktu tutup, kita disconnect
    prisma.$disconnect(); 
  }
}

dumpData();