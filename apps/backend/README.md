# backend

## Setup Data
Beberapa data yang perlu disiapkan (build di [Google Collab](#))

<details><summary>`src/data/item_matkul_list.json`</summary>

Contoh Isinya:
```json
{
  "0": "Administrasi Sistem Operasi Berbasis Open Source",
  "1": "Agama",
  "2": "Algoritma dan Pemrograman",
  ...
  "37": [
    "Etika Profesi",
    "Etika Profesi Teknologi Informasi"
  ]
}
```
</details>

<details><summary>`src/data/user_cf_results.json`</summary>

Contoh isinya:
```json
{
  "580": {
    "5": 0.826359212398529,
    "10": 0.842545211315155,
    "14": 0.9497200846672058,
    "16": 0.8346580862998962,
    "17": 0.7342939972877502,
    "27": 0.6794408559799194,
    "228": 0.7661208510398865
  },
  "581": {
    "4": 0.7690456509590149,
    "5": 0.9045738577842712,
    ...
  }
}
```
</details>

## AWS S3 Model Chatbot TFJS Deployment
1. Build model chatbot pakai kode [Google Colab ini](#)
2. Simpan di `apps/backend/tfjs_saved_model/*` (agar juga dapat dipakai di local)
3. Upload model ke AWS S3. Struktur yang benar:
```sh
s3://your-bucket/tfjs-model/
  ├── model.json
  ├── group1-shard1ofX.bin
  ├── word_index.json
  ├── content.json
```
4. Upload via AWS CLI:
- Install AWS Windows: `msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi`
- Config User (buat Access Key IAM anda dulu): `aws configure` (contoh di bawah)
```sh
AWS Access Key ID [None]: AKIAZ3MGNLZ3MxxPxxx
AWS Secret Access Key [None]: N+/fUo+pjg4VrWeNaBuk0eFmeEuk8egw3Yxxxxx
Default region name [None]: us-east-1
Default output format [None]: json
```
- Upload folder (dengan cache control)
```sh
aws s3 sync ./tfjs_saved_model s3://chatbot-rekomendasi/tfjs-model --cache-control "public, max-age=31536000, immutable"
```
5. Private S3 + Signed URL 

## AWS Lambda Deployment
Setup AWS Parameter Store:
```sh
DATABASE_URL // isi AWS RDS Postgress
JWT_SECRET // kunci random anda
```


```sh
# -- Setup prisma ke AWS Lambda Function --
# 1. generate client menggunakan schema-postgres.prisma
bunx prisma generate --schema prisma/schema-postgres.prisma
## akan membuat client di `src/generated/prisma-pg`

# 2. build seluruh kode di 1 file (tapi pisahkan prisma dari build code)
## [?] Menggunakan --target node karena kita pakai runtime "Node", bukan "Bun"
## [?] --format cjs, Common JS. mengganti ESM 'import.meta', jadi CJS 'require'
bun build src/lambda.ts --outdir dist-lambda --target node --format cjs --external prisma

# 3. copy Generated Prisma Client (postgres), dependency, & certificate
cp -r src/generated/prisma-pg dist-lambda/generated/prisma-pg

# jika SSH key belum ada
mkdir -p cert && curl -o cert/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

mkdir -p dist-lambda/cert && cp cert/global-bundle.pem dist-lambda/cert
cp -r node_modules/.prisma dist-lambda/node_modules/.prisma 2>/dev/null || true

# 4. ZIP untuk upload (38MB -> 3.8MB) (install zip, cth di archLinux: `pacmap -S zip`)
cd dist-lambda && zip -r ../lambda-backend.zip . && cd ..
```