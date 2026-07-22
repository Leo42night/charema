<img align="center" src="https://raw.githubusercontent.com/Leo42night/Leo42night/main/img/cover-charema.png" />

Proyek ini dibuat untuk Skripsi saya sebagai Mahasiswa S1 Sistem Infromasi Universitas Tanjungpura akt 2022. Skripsi dengan judul "Implementasi *Chatbot* Rekomendasi Mata Kuliah menggunakan *Neural Colaborative Filtering*".

## Features
Main:
- **Chatbot** model *Feed-Forward Neural Network* dengan custom dialog. Unlock **8 intent** & min **5 kritik chat** untuk mendapatkan reward. Run di frontend menggunakan [TensorflowJS](https://www.tensorflow.org/js/tutorials). Local Storage tetap terenkripsi dengan Cipher jadi lebih sulit untuk dilihat response nya.
- **Rekomendasi Matkul** model *Neural Collaborative-Filtering* dengan dataset Nilai mahasiswa Sisfo & Resiksom Untan dari tahun 2021-2025. 

> [!NOTE]
> Target penelitian adalah mahasiswa akt 2023-2025. Prediction sudah dilakukan sebelumnya untuk mencangkup semua kemungkinan skenario. Jadi tidak perlu server inference, proses prediction lebih cepat.

Additional:
- **Google Auth** untuk Verifikasi Login Mahasiswa target penelitian.

## Tech Stack
Proyek Monorepo dikelola menggunakan [BunJs](https://bun.com/), kode dengan [Typescript](https://www.typescriptlang.org/):
- FE: [Vite](https://vite.dev/), [React](https://react.dev/), [TailwindCSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/).
- BE: [ElysiaJs](https://elysiajs.com/), [Prisma](https://www.prisma.io/) (Dev: SQLite, Prod: Postgress).
- Deployment FE ke AWS S3+Cloudflare (koneksi Domain) & BE ke AWS Lambda.
- CI/CD: [AWS CLI](https://aws.amazon.com/cli/).

## Setup
- [Google Colab for training Model Chatbot](#) (Akan dishare setelah ada pemenang reward). Karena Tensorflow cukup berat jika diinstall di local, jadi saya pakai Google Colab dengan runtime CPU (karena dataset ringan & cuma pakai layer GlobalAveragePooling1D)
    - Extract `tfjs_saved_model.zip` ke folder `dev/` untuk di test di index.html 
    - Jika prediction berhasil. run `cd apps/backend && bun dev/encrypt-json.ts` (buat veri ter enkripsi)
    - masukkan file `model.json` dan `group*.bin` ke dalam `frontend/public/tfjs_saved_model`.
- [Google Colab for training Model Rekomendasi NCF](https://colab.research.google.com/drive/1br3PCcA9Y2mHORYiSmLJ1x3L9WRsPNLl)
    - `backend/src/data/user_cf_scores.json` (hasil model rekomendasi), 
    - `frontend/src/data/`: 
        - `item_matkul.json` (skema item untuk dapat detail matkul[nama, kode, sks, semester, dosen] by H11, H10, or same), 
        - `nim_to_user.json` (ambil user key untuk kirim ke BE setelah dapat email pas login)
        - `category.json` (matkul yang tidak ada item_id (only by category_id) & map category_id -> name)
        - `rekap.json` (untuk halaman about)
    - `user_to_nim.json` (statistik user data[score,prodi-angkatan], check email non target) 

## Previous Version
- [Deploy AWS](https://github.com/Leo42night/charema/commit/adaf47486cf1fbd2f588be2d60a36f6db2cc22d5)

## Tools
```sh
# hapus folder node_modules, untuk reset skema monorepo agar distribusi package tersentralisasi
FOR /d /r . %d in (node_modules) DO @IF EXIST "%d" rd /s /q "%d"
bun install

# hilangkan file dari history commit
pip install git-filter-repo
git filter-repo --path <path/to/file> --invert-paths --force
git remote add origin <repo_url>
git push origin main --force
# cek di history commit
git log --oneline -- <path/to/file>
```