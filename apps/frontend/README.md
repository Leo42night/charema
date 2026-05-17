# Tugas Akhir - Front End

## Dependency Explanation
pakai AI jelaskan singkat

## Deploy to S3 & Cloudflare

### **Upload via AWS CLI**
<details><summary>Step Upload via CLI</summary>

```sh
aws configure  # masukkan Access Key dari IAM User kamu 
# atau: `aws configure --profile anggota-d` (sesuaikan nama)
  # Masukkan Key ID, Secret, default region (cth: 'us-east-1'), default output 'json'
  # Jika sudah, periksa koneksi (jika tampil file json ->   STS berhasil)
aws sts get-caller-identity 

bun run build
# pastikan folder `apps/frontend/dist/` ada.
# sinkronisasi bucked (upload + hapus), hanya upload file yang berubah (cache 1 tahun)
aws s3 sync dist/ s3://www.chatbot-remaku.site/ --cache-control "max-age=31536000" --exclude "index.html"
aws s3 cp dist/index.html s3://www.chatbot-remaku.site/index.html   --cache-control "no-cache, no-store"
# tambahkan `--profile anggota-d` (sesuaikan nama) jika bukan default profile

# Upload index.html terpisah karena tanpa cache (SPA perlu selalu fresh)
```

**Akses frontend**
```sh
http://chatbot-remaku.site.s3-website-us-east-1.amazonaws.com

# Atau cek di: S3 → bucket → Properties → Static website hosting → Bucket website endpoint
```
</details>