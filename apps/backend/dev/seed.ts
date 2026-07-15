let prisma: any;

async function initializeDatabase() {
  if (process.env.NODE_ENV === "dev") {
    const { getPrisma: localDb, dbUrl } = await import("../prisma/db");
    prisma = localDb();
    // console.log("dbUrl", dbUrl);
  } else {
    const { getPrisma: prodDb } = await import("../prisma/dbPostgres");
    prisma = prodDb();
  }
}

async function main() {
  await initializeDatabase();

  // console.log("Memulai proses seeding data dummy...");

  // 1. Bersihkan database terlebih dahulu untuk menghindari bentrok primary key / duplikasi data
  // Urutan penghapusan bebas karena saat ini belum ada tabel yang terikat Foreign Key eksplisit
  await prisma.recomTarget.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.feedback.deleteMany({});

  // console.log("Database berhasil dibersihkan.");

  // 2. Seed Tabel RecomTarget
  await prisma.recomTarget.createMany({
    data: [
      { user_key: 4041, matkuls: [1, 2, 3, "Kalkulus IA"] },
      { user_key: 4042, matkuls: [4, 5, "Algoritma Pemrograman"] },
      { user_key: 4043, matkuls: [2, "Struktur Data", 6, 7] },
      { user_key: 4044, matkuls: [8, 9, 10] },
    ]
  });
  // console.log("Selesai seeding: RecomTarget");

  // 3. Seed Tabel Score (user_key bertindak sebagai Primary Key unik)
  await prisma.score.createMany({
    data: [
      { user_key: 4041, score_cf: 5, score_chat: 4 },
      { user_key: 4042, score_cf: 3, score_chat: 5 },
      { user_key: 4043, score_cf: 4, score_chat: 4 },
      { user_key: 4044, score_cf: 2, score_chat: 3 },
    ]
  });
  // console.log("Selesai seeding: Score");

  // 4. Seed Tabel Achievement (user_key bertindak sebagai Primary Key unik)
  // Menyediakan variasi panjang array JSON untuk menguji fungsionalitas top 10 user Anda sebelumnya
  await prisma.achievement.createMany({
    data: [
      { user_key: 4041, tags: ["dummy: Cum Laude", "Alpro Master", "Fast Learner"] }, // 3 tags
      { user_key: 4042, tags: ["dummy: Math Whiz"] },                              // 1 tag
      { user_key: 4043, tags: ["dummy: Overachiever", "Consistent", "Data Guru"] }, // 3 tags
      { user_key: 4044, tags: [] },                                         // 0 tags (Empty Array)
    ]
  });
  // console.log("Selesai seeding: Achievement");

  // 5. Seed Tabel Feedback
  // Mencakup skenario validasi bisnis Anda (user_key ada/kosong, email ada/kosong)
  await prisma.feedback.createMany({
    data: [
      {
        user_key: 4041,
        email: "user101@mahasiswa.ac.id",
        input: "Rekomendasi semester 3 kurang akurat",
        res_tag: "greeting",
        res_message: "Matkul tidak ditemukan",
        feedback: "dummy: Tolong perbaiki data kurikulum terbaru"
      },
      {
        user_key: 4042,
        email: null, // Skenario: Hanya mengirim user_key tanpa email
        input: "Fitur chat AI sangat responsif",
        res_tag: "greeting",
        res_message: "Sukses",
        feedback: "dummy: Pertahankan performa model LLM ini"
      },
      {
        user_key: null, // Skenario: Anonim, tidak punya user_key namun wajib menyertakan email
        email: "anonim_guest@gmail.com",
        input: "Apakah aplikasi ini gratis diakses umum?",
        res_tag: "greeting",
        res_message: "Info Sistem",
        feedback: "dummy: Saya sangat terbantu menjajali fiturnya"
      }
    ]
  });
  // console.log("Selesai seeding: Feedback");

  // console.log("Proses seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("Terjadi error saat proses seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
