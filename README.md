# Web Chatbot Rekomendasi Matkul
`[--Image masukkan ke sini, logo & BG 3D Perspective UI Design--]`

Proyek ini dibuat untuk Skripsi saya sebagai Mahasiswa S1 Sistem Infromasi Universitas Tanjungpura akt 2022.Skripsi dengan judul "Implementasi Chatbot Rekomendasi Mata Kuliah menggunakan Neural Colaborative Filtering".

## Features
Main:
- **Chatbot** model Feed-Forward Neural Network dengan custom dialog. Unlock 10 intent untuk mendapatkan reward. Run di frontend menggunakan [TensorflowJS](https://www.tensorflow.org/js/tutorials). Local Storage tetap terenkripsi dengan Cipher jadi lebih sulit untuk dilihat response nya.
- **Rekomendasi Matkul** model Neural Collaborative-Filtering dengan dataset Nilai mahasiswa Sisfo & Resiksom Untan dari tahun 2021-2025. 

> [!NOTE]
> Target penelitian adalah mahasiswa akt 2023-2025. Prediction sudah dilakukan sebelumnya untuk mencangkup semua kemungkinan skenario. Jadi tidak perlu fitur inference, proses prediction lebih cepat.

Additional:
- **Google Auth** untuk Verifikasi Login Mahasiswa target penelitian.

## Tech Stack
- Proyek Monorepo dikelola menggunakan [BunJs](https://bun.com/).
- FE: [Typescript](https://www.typescriptlang.org/), [Vite](https://vite.dev/), [React](https://react.dev/), [TailwindCSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/).
- BE: [ElysiaJs](https://elysiajs.com/), [Prisma](https://www.prisma.io/) (Dev: SQLite, Prod: Postgress).
- Deployment FE ke AWS S3+Cloudfront (koneksi Domain) & BE ke AWS Lambda.

## How to make my Own Chatbot
- [Google Colab for Training Model Chatbot](https://colab.research.google.com/drive/1tL2IW8GLvUMuqvCRzmAPCy3xBHI2mI1K?usp=sharing). Karena Tensorflow cukup berat jika diinstall di local, jadi saya pakai Google Colab dengan runtime CPU (karena dataset ringan & cuma pakai layer GlobalAveragePooling1D)

## Progress Main Issue
- [x] Layout Chatbot Responsive di mobile saat  keyboard aktif.
- [x] Handle pastikan image setelah login benar-benar diload, agar tidak 404.
- [x] fitur chatbot.
- [x] fitur alur rekomendasi. (! fix bug minor skor tidak tampil)
- [x] fitur achivement & reward. (! rapikan saved progress sebagai input)
- [x] fitur about berisi detail proyek, infromasi statistik dari BE dan info reward. (! perlu realtime data statistik progress dari BE)

## Tools
```sh
# hapus folder node_modules, apabila anda tidak sengaja add seluruh package di 1 folder saja
FOR /d /r . %d in (node_modules) DO @IF EXIST "%d" rd /s /q "%d"
```