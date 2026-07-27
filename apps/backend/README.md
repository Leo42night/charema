# Tugas Akhir - Backend

## Setup Data & Database
1. Data JSON yang perlu disiapkan Google Collab NCF Rekomendasi (lihat `README.md` utama). gunakan template `user_cf_scores-dummy.json` untuk testing.
2. Database: setup Awal agar jalan di local
```sh
cd apps/backend
# -- local
bun prisma migrate dev --name init # update *.prisma -> update db & buat sql migrasi
## [!] Paksa reset (tanpa buat migrasi), jika ada update *.prisma skema database
bun prisma db push --force-reset

bun prisma generate
bun prisma generate --schema prisma/schema-pg.prisma
# bun prisma db seed
## koneksi `dev.db` ke HeidiSQL Sqlite, lihat isinya
```

3. Database: Deployment ke production
```sh
# -- Production (Turso)
## masuk ke migrations sql di backend yg berisi query "CREATE TABLE...", salin!
## masuk ke Turso > Edit Data > SQL Console, Run query di situ.
## Isi backend/package.json script "seed:turso": "bun --env-file=.env.production prisma/seed.ts", pastikan DATABASE_URL postgres di `.env.production` ada)
bun seed:turso
## lihat turso web apakah data terisi

# -- Production (Postgres)
bun prisma generate --schema prisma/schema-pg.prisma
## migrasi skema database ke Postgres
bun --env-file=.env.production prisma db push --force-reset
## Isi backend/package.json script "bun --env-file=.env.production prisma/seed.ts", pastikan DATABASE_URL postgres di `.env.production` ada)
bun seed:pg
## lihat isinya di heidiSQL koneksi Postgres
```
Jika butuh install HeidiSQL ringan pakai [Setup Laragon Ini](https://drive.google.com/drive/folders/1w6Mz9eMF7XSbuu_Hc8chqfEiQondMfEK)

## Update 2nd Winner
Setelah fase 1st winner selesai (1st winner ditemukan). Memasuki tahap baru.
```sql
INSERT INTO "CalonWinner" (user_key, created_at)
SELECT a.user_key, NOW()
FROM "Achievement" a
WHERE jsonb_array_length(a.tags::jsonb) >= 15
  AND EXISTS (
    SELECT 1 FROM "Score" s
    WHERE s.user_key = a.user_key
  )
  AND (
    SELECT COUNT(*) FROM "Feedback" f
    WHERE f.user_key = a.user_key
  ) = 4
ON CONFLICT (user_key) DO NOTHING;
```