# Tugas Akhir - Backend

## Setup Data & Database
1. Data JSON yang perlu disiapkan Google Collab NCF Rekomendasi (lihat `README.md` utama). gunakan template `user_cf_scores-dummy.json` untuk testing.
2. Database: setup Awal agar jalan di local
```sh
cd apps/backend
# -- local
bun prisma migrate dev --name init # update *.prisma -> update db & buat sql migrasi 
bun prisma generate
bun prisma generate --schema prisma/schema-pg.prisma
bun prisma db seed
## koneksi `dev.db` ke HeidiSQL Sqlite, lihat isinya
bun prisma db push # jika ada update *.prisma -> update db
```
3. Database: Deployment ke production
```sh
# -- Production (Turso)
## masuk ke migrations sql di backend yg berisi query "CREATE TABLE...", salin!
## masuk ke Turso > Edit Data > SQL Console, Run query di situ.
## Isi backend/package.json script "seed:turso": "bun --env-file=.env.production prisma/seed.ts", pastikan DATABASE_URL postgres di `.env.production` ada)
bun seed:turso
## lihat turso web apakah data terisi

# -- Production (AWS RDS Postgres)
bun prisma generate --schema prisma/schema-postgres.prisma
## migrasi skema database ke RDS Postgres
bun --env-file=.env.production prisma db push --force-reset
## Isi backend/package.json script "bun --env-file=.env.production prisma/seed.ts", pastikan DATABASE_URL postgres di `.env.production` ada)
bun seed:pg
## lihat isinya di heidiSQL koneksi Postgres
```
Jika butuh install HeidiSQL ringan pakai [Setup Laragon Ini](https://drive.google.com/drive/folders/1w6Mz9eMF7XSbuu_Hc8chqfEiQondMfEK)

## AWS S3 Model Chatbot TFJS Deployment
1. Build model chatbot pakai kode [Google Colab Chatbot FFNN](lihat di `README.md` utama)
2. Simpan di `apps/frontend/tfjs_saved_model/*` (agar juga dapat dipakai di local)
3. Upload model ke AWS S3. Struktur yang benar:
```sh
s3://your-bucket/tfjs-model/
  ├── model.json
  ├── group1-shard1ofX.bin
  ├── word_index.json
  ├── content.json
```
4. Upload via AWS CLI:
- Ikuti [Docs setup AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions)
- Config User (buat Access Key IAM anda dulu): `aws configure` (contoh di bawah)
```sh
AWS Access Key ID [None]: AKIAZ3MGNLZ3MxxPxxx
AWS Secret Access Key [None]: N+/fUo+pjg4VrWeNaBuk0eFmeEuk8egw3Yxxxxx
Default region name [None]: us-east-1
Default output format [None]: json
```
- Upload folder (dengan cache control)
```sh
aws s3 sync ./tfjs_saved_model s3://chatbot-remaku/tfjs-model --cache-control "public, max-age=31536000, immutable"
```

## AWS Lambda Deployment
Proyek ini di desain untuk kompatibel di-`deploy` ke AWS Lambda

Setup AWS Parameter Store:
```sh
/remaku/DATABASE_URL // isi AWS RDS Postgress
/remaku/JWT_SECRET // kunci random anda
/remaku/API_KEY // api key
/remaku/FRONTEND_URL // kode frontend url (tunggu frontend selesai di up)
```

#### Install, Generate & Build

```sh
# -- Setup prisma ke AWS Lambda Function --
# 1. generate client menggunakan schema-pg.prisma (lambda butuh ini)
cd apps/backend && bunx prisma generate --schema prisma/schema-pg.prisma
## akan membuat client di `src/generated/prisma-pg`

# 2. build seluruh kode di 1 file (tapi pisahkan prisma dari build code)
## [?] Menggunakan --target node karena kita pakai runtime "Node", bukan "Bun"
## [?] --format cjs, Common JS. mengganti ESM 'import.meta', jadi CJS 'require'
bun build src/lambda.ts --outdir dist-lambda --target node --format cjs --external prisma

# 3. copy Generated Prisma Client (postgres), dependency, & certificate
## Versi Windows CMD
xcopy /s /i /e src\generated\prisma-pg dist-lambda\generated\prisma-pg
## -- jika SSH key belum ada --
if not exist cert mkdir cert && curl -o cert/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
### -- masukkan SSH & node_modules/.prisma ke folder dist-lambda/ -- 
if not exist "dist-lambda\cert" mkdir "dist-lambda\cert" && xcopy /y "cert\global-bundle.pem" "dist-lambda\cert\"
```
```sh
# 4. Zipping & UP ke Lambda
### Zipping untuk upload (10MB -> 3.8MB)
cd dist-lambda && powershell -NoProfile -Command "Compress-Archive -Path * -DestinationPath ../lambda-backend.zip -Force" && cd ..
aws lambda update-function-code --function-name remaku-be --zip-file fileb://lambda-backend.zip

aws lambda update-function-configuration --function-name remaku-be --environment "Variables={NODE_ENV=production}"
```

### 2. Buat Lambda function di AWS Console
Buat Function -> Tambah Role -> Upload ZIP konfigurasi env vars & Function URL. 

**Proses Lambda function Backend Elysia Prisma berikut:**
<details><summary>Buat Lambda Function</summary>

```sh
Buka Aws Console -> Select region "us-east-1 (N. Virginia)"
Lambda → Create function → Author from scratch
  Function name: monorepo-backend
  Runtime: Node.js ^24.x  (Latest support, atau pilih Amazon Linux jika ingin "custom" pakai bun layer)
  Architecture: x86_64 (default)
  
  Execution role: "Create new role" with basic Lambda permissions
  → setelah dibuat, attach policy SSM read (dari Admin)
```
</details>

<details><summary>Minta admin tambahkan policy ke Role yang baru dibuat</summary>

Biasanya namanya **monorepo-backend-role-xxx**. Supaya Lambda Function dapat akses env vars di SSM.
```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "LambdaAccessSSMKey",
			"Effect": "Allow",
			"Action": [
				"ssm:GetParameters",
				"ssm:GetParameter",
				"kms:Decrypt"
			],
			"Resource": [
				"arn:aws:ssm:us-east-1:AWS_ACCOUNT_ID:parameter/remaku/*"
			]
		}
	]
}
```
Beri nama `additionalPolicy_LambdaBE`

**✨ Tips**: gunakan fitur search resource biar mudah
</details>

Push kode ke lambda:
```sh
cd apps/backend
aws lambda update-function-code --function-name remaku-be --zip-file fileb://lambda-backend.zip
```

<details><summary>Upload ZIP</summary>

```sh
Lambda → Functions → [nama function]
  -> tab "Code" → Upload from → .zip file → pilih lambda-backend.zip
    -> Runtime Settings -> Edit
      Handler: lambda.handler
  -> tab "Configuration" -> Edit
      Memory: 512 MB (minimum untuk prisma)
      Timeout: 1 menit (default 3 detik terlalu kecil untuk cold start Prisma)
```
</details>

<details><summary>Set environment variables dari Parameter Store</summary>

```sh
Lambda → Configuration → Environment variables:
  NODE_ENV = production
  
  # Untuk secret mengunakan SSM parameter store reference, BUKAN plaintext di sini
  # dynamic load dari SSM sudah di set di config.ts
```
</details>

<details><summary>Buat Lambda Function URL</summary>

```sh
Lambda → Functions -> Masuk ke fungsi yang baru dibuat
  → tab Configuration → Function URL → Create function URL
    Auth type: NONE  (kita pakai API_KEY manual dari kode Elysia)
    CORS: Disabled (CORS di-handle manual dari kode Elysia)

→ Salin Function URL yang muncul (format: https://xxxxxxxx.lambda-url.us-east-1.on.aws)
```
</details>

Cek Log: run `aws logs tail /aws/lambda/remaku-be --follow` (login dulu `aws login --remote`)

---

## SQLite3
Untuk kelola database sqlite (dev).

### 1. Instalasi
*   **Windows**: Unduh **sqlite-tools** dari [sqlite.org](https://sqlite.org). Ekstrak file `.exe` ke sebuah folder (misal `C:\sqlite`), lalu daftarkan folder tersebut ke **Environment Variables (PATH)** sistem Anda.
*   **macOS**: Jalankan `brew install sqlite` via Homebrew (atau gunakan versi bawaan mac).
*   **Linux (Ubuntu/Debian)**: Jalankan `sudo apt update && sudo apt install sqlite3`.

### 2. Membuka Database & Mengatur Format
Masuk ke direktori tempat database berada melalui terminal, lalu jalankan perintah berikut:
```bash
sqlite3 dev.db
```
Setelah masuk ke *prompt* `sqlite>`, ketik dua perintah ini agar tampilan data rapi berbentuk tabel:
```sqlite
.mode table
.headers on
```

### 3. Perintah Navigasi Utama
*   **Melihat daftar tabel:** `.tables`
*   **Melihat skema/struktur tabel:** `.schema nama_tabel`
*   **Keluar dari aplikasi:** `.exit`

### 4. Contoh Query SQL Populer
*   **Lihat seluruh isi data:** `SELECT * FROM Feedback;`
*   **Lihat 5 data terbaru:** `SELECT * FROM RecomTarget ORDER BY createdAt DESC LIMIT 5;`
*   **Hapus semua isi tabel:** `DELETE FROM Score;`