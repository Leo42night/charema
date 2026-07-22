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