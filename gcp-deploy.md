## Hapus Dependensi AWS
```sh
bun remove @aws-sdk/client-apigatewaymanagementapi @aws-sdk/client-dynamodb @aws-sdk/client-s3 @aws-sdk/client-ssm @aws-sdk/s3-request-presigner @types/aws-lambda
```

## DB ke Cloud SQL
- Postgres (Free Trial 30 hari) (pakai nilai default).
- Connections -> Networking:
    - Instance IP assignment -> Public IP (Check)
    - Authorized networks (All `0.0.0.0/0` atau My IP)
    <!-- - Data API authorization -> Allow Data API (Check) -->
- Connections -> Security:
    - Allow only SSL connections (Select)
    - Manage server CA certificates (Create -> Download -> Rotate)
- Test di Heidi, contoh koneksi:
```sh
DATABASE_URL='postgresql://postgres:%11Ab1Abb1|A0b1A@34.41.101.194:5432/postgres'
```

## Backend ke Cloud Run
- Siapkan `backend/.env.production` dari `backend/.env.template`.  
```sh
# sesuaikan project default
gcloud config set project PROJECT_ID
# cek -> gcloud config get-value project
# lihat INSTANCE_ID=NAME, region, & PUBLIC_IP (masukkan ke .env.production)
gcloud sql instances list
```
- File: `Dockerfile` & `.dockerignore`. `.gcloudignore` (agar env dapat masuk ke build)
```sh
gcloud init
# dapatkan project number
gcloud projects describe PROJECT_ID --format="value(projectNumber)"

# [1st] tambahkan akses SA project ke Cloud SQL
gcloud projects add-iam-policy-binding PROJECT_ID --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/cloudsql.client" --condition=None
## Jika Beda Project (Project A Cloud Run -> Project B Cloud SQL)
    gcloud projects add-iam-policy-binding ID_PROJECT_B --member="serviceAccount:PROJECT_NUMBER_A-compute@developer.gserviceaccount.com" --role="roles/cloudsql.client" --condition=None
    ## Enable API utnuk kedua Project
    gcloud services enable sqladmin.googleapis.com --project=PROJECT_A
    gcloud services enable sqladmin.googleapis.com --project=PROJECT_B

# > cek iam akses SA project ke cloudSQL berhasil (PROJECT_ID dari Cloud SQL)
gcloud projects get-iam-policy PROJECT_ID --flatten="bindings[].members" --filter="bindings.role:roles/cloudsql.client"

# ! Jika schema database ada perubahan, pastika client di generate dulu
cd apps/backend && bun prisma generate --schema prisma/schema-pg.prisma && cd ../.. 

# DEPLOY: panggil Dockerfile (jalankan di root project, instance id adalah Name)
gcloud run deploy elysia-app --source . --allow-unauthenticated --region us-east1 --add-cloudsql-instances PROJECT_ID_SQL:us-central1:NAME --project=PROJECT_ID_RUN --max-instances=1
# => Masukkan Service URL ke frontend/.env.production.local 
# ? Allow unauthenticated = dapat diakses public, config akses cloud SQL spesifik
# ? Jika sudah intial run, setelahnya cukup run -> gcloud run deploy elysia-app --source . 

# > Cek annotation 'run.googleapis.com/cloudsql-instances' di revision aktif
gcloud run services describe elysia-app --region us-east1 --format="yaml(spec.template.metadata.annotations)"
# > check env
gcloud run services describe elysia-app --region us-east1 --format="yaml(spec.template.spec.containers[0].env)"

# > Monitor (ECONNREFUSED, ETIMEDOUT, self signed certificate, password authentication failed)
gcloud beta run services logs tail elysia-app --region us-east1
### coba cek /data/env, console log akan tampil ke sini.


# [!] --- jiak ingin hapus/reset ---
gcloud run services delete elysia-app --region us-east1 --quiet
gcloud projects remove-iam-policy-binding PROJECT_ID --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/cloudsql.client"
```

## Frontend (Firebase Hosting)
Files: 
- `frontend/.firebaserc`
- `frontend/firebase.json`
```sh
cd apps/frontend
bun run build
bun add -g firebase-tools
# [1st] login dan setup default project
bunx firebase login
bunx firebase deploy

# -- custom domain (cloudflare) --
Firebase Console -> Hosting & Serverless -> Hosting -> Add Custom Domain
    -> [paste DOMAIN] -> Confirm
    -> [tambahkan Custom domain firebase www.DOMAIN redirect to DOMAIN] -> Confirm
    -> [Tambahkan Record ke Cloudflare] -> Verify
Cloudflare Dashboard -> [Domain] -> DNS -> Record -> DNS Record
    -> [Tambahkan Record dari firebase] (untuk A record, matikan Proxy jadi 'DNS Only')
    -> Tambah record CNAME www [domain firebase] (DNS Only)
# Propagasi Est. 1-5 menit.
Cloudflare Dashboard -> SSL/TLS -> Overview -> Configure -> Full(Strict)
# Cek domain di https://www.whatsmydns.net/ (ip harus mengarah ke A Record) 
# Tunggu SSL Selesai dibuat & web berhasil dimuat, baru Proxy lagi A Record.
```