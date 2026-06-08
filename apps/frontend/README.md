# Tugas Akhir - Front End

## Dependency Explanation
### 1. Fitur Utama & Fungsionalitas Khusus

| Nama Library | Fungsi Khusus / Alasan Digunakan |
|---|---|
| @tensorflow/tfjs | Menjalankan model AI / Machine Learning langsung di dalam browser pengguna tanpa tergantung server backend. |
| @react-oauth/google | Menyediakan fitur Sign in with Google untuk autentikasi user secara instan. |
| recharts | Membuat grafik interaktif (seperti diagram batang, garis, atau lingkaran) untuk visualisasi data. |
| react-joyride | Membuat fitur tour / panduan interaktif (pop-up penunjuk) untuk mengenalkan fitur aplikasi kepada pengguna baru. |

### 2. Komponen Antarmuka (UI) & Interaksi Spesifik

| Nama Library | Fungsi Khusus / Alasan Digunakan |
|---|---|
| sonner | Menampilkan notifikasi pop-up (toast) yang melayang di sudut layar saat ada aksi sukses/gagal. |
| framer-motion | Membuat animasi UI tingkat lanjut (seperti efek transisi halaman, drag, atau elemen yang muncul saat di-scroll). |
| @base-ui/react | Komponen UI tingkat rendah tanpa styling (headless UI) bawaan tim Radix untuk fleksibilitas desain maksimal. |
| @fontsource-variable/jetbrains-mono | Font khusus JetBrains Mono yang biasanya dipakai jika aplikasi Anda menampilkan blok kode pemograman (code viewer). |

### 3. Konfigurasi Sistem Khusus

| Nama Library | Fungsi Khusus / Alasan Digunakan |
|---|---|
| vite-plugin-pwa | Mengubah aplikasi web Anda menjadi PWA (Progressive Web App) sehingga bisa diinstal di HP/Desktop seperti aplikasi native dan bisa diakses offline. |
| shared | Menandakan proyek ini menggunakan sistem Monorepo (Workspace), di mana kode ini berbagi fungsi dengan sub-projek lokal lainnya. |
| kill-port | Mengatasi error port macet saat proses development, otomatis mematikan server lokal yang menggantung di latar belakang. |

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