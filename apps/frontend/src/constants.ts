// ─── Dummy Data ───────────────────────────────────────────────────────────────

import type { MataKuliah } from "./types";

//  --- Development dummy data, untuk pengguna awal, bisa diganti dengan API call ke backend nanti ---
// dummy user: untuk testing setelah login & aktivasi fitur rekomendasi 
export const dummyUser = {
    name: "Budi Santoso",
    given_name: "Budi",
    email: "h1101231001@student.untan.ac.id",
    picture: "https://lh3.googleusercontent.com/a/ACg8ocItZPaKM6xWbFTel2XTVH8DAqzpFaB6jefke-FvIS87qLTgAp4=s96-c",
};

export const dummyDatabase: Record<string, { nama: string; jurusan: string }> = {
    H11001234: { nama: "Budi Santoso", jurusan: "Teknik Informatika" },
    H11005678: { nama: "Siti Nurhaliza", jurusan: "Sistem Informasi" },
    H11009876: { nama: "Ahmad Rizki", jurusan: "Teknik Komputer" },
};
 
export const dummyMataKuliah: MataKuliah[] = [
    { kode: "TIF101", nama: "Pemrograman Dasar", sks: 3, semester: 1, dosen: "Dr. Ahmad" },
    { kode: "TIF102", nama: "Struktur Data", sks: 3, semester: 2, dosen: "Dr. Budi" },
    { kode: "TIF103", nama: "Algoritma dan Pemrograman", sks: 4, semester: 1, dosen: "Dr. Citra" },
    { kode: "TIF201", nama: "Basis Data", sks: 3, semester: 3, dosen: "Dr. Dewi" },
    { kode: "TIF202", nama: "Pemrograman Web", sks: 3, semester: 3, dosen: "Dr. Eko" },
    { kode: "TIF203", nama: "Jaringan Komputer", sks: 3, semester: 4, dosen: "Dr. Fani" },
    { kode: "TIF301", nama: "Kecerdasan Buatan", sks: 3, semester: 5, dosen: "Dr. Gani" },
    { kode: "TIF302", nama: "Machine Learning", sks: 4, semester: 6, dosen: "Dr. Hana" },
    { kode: "TIF303", nama: "Sistem Operasi", sks: 3, semester: 4, dosen: "Dr. Irfan" },
    { kode: "TIF304", nama: "Rekayasa Perangkat Lunak", sks: 3, semester: 5, dosen: "Dr. Joko" },
];

export const SUGGESTED_PROMPTS = ["Hallo!", "Kamu ini apa?", "Kasih Rekomendasi mata kuliah dong!"];

// local storage keys and cypher key (contant folding akan memakai nilai di env jika ada, jadi fallback value tidak akan pernah dipakai di production, hanya untuk development lokal saja)
export const STORAGE_VERSION_KEY = "1.0.0"; // Bisa diupdate jika ada perubahan besar pada struktur data (reset localStorage browser user)
export const USER_STORAGE_KEY = import.meta.env.VITE_USER_STORAGE_KEY || "user_data";
export const AVAILABLE_MATKULS_STORAGE_KEY = import.meta.env.VITE_AVAILABLE_MATKULS_STORAGE_KEY || "available_matkuls";
export const CYPHER_KEY = import.meta.env.VITE_CYPHER_KEY || "default_cypher_key_12345";

// chat model key & achievement key
export const ACHIEVEMENT_TAGS_KEY = import.meta.env.VITE_ACHIEVEMENT_TAGS_KEY || "achievement";
export const TOTAL_TAGS = 10;