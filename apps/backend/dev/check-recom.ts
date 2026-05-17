import { getPrisma } from "../prisma/dbPostgres"; // path ke file getPrisma PG Anda

async function cek() {
  const prisma = getPrisma();
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL); // Cek apakah env sudah terbaca
    const count = await prisma.recomTarget.count();
    console.log(`📊 Jumlah data di RecomTarget: ${count}`);
  } catch (e) {
    console.error("❌ Tabel tidak ditemukan atau error:", e.message);
  }
}
cek();