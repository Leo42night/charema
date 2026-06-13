export interface UserData {
    name: string;
    given_name: string;
    email: string;
    picture: string;
    user_key?: number; // from nim in email map into nim_to_user
}

export interface CategoryData { // category.json 
    category: Record<string, CategoryMatkul[]>;
    category_map: Record<string, string>;
}

export interface CategoryResult { // hitungan category khusus
    category: string; // "1", "2", etc.
    totalScore: number; // 1.23, 0.88, etc.
    count: number; // 1, 3, etc.
}

export interface CategoryMatkul { // matkul yang tidak ada di history
    semester: number;
    kode: string; // cth: "SI-7208"
    matkul: string; // cth: "Analisis Deret Waktu"
    sks: number; // cth: 3
    prasyarat: string | null; // cth: "SI-2013, SI-3016"
    wajib: number; // 1: yes, 0: no
    category: number; // key for category_map
}

export interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    tag?: string;
    isError?: boolean;
    showMatkulModal?: boolean;
    selectedMatkulIds?: number[]; // seleksi matkul di modal rekomendasi
    showTourButton?: boolean;
}

interface MataKuliahData { // !!! bisa merge ke bawah
    matkul: string;
    dosen: string;
    tahun: number; // tahun riwayat terbaru
    sm: number; // 1 (genap), 7 (ganjil)
    category: number; // key untuk category
    kode: string | null;
    sks: number | null;
    semester?: number | null;
    prasyarat?: string | null;
    wajib?: number | null;
    rank?: number; // untuk rekomendasi
    score?: number; // untuk rekomendasi, bisa diisi dengan skor relevansi dari backend
}

export interface MataKuliah extends MataKuliahData {
    item: number; // unique identifier dari training dataset item.
}

type Matkuls = Record<string, MataKuliahData>;
export type ItemMatkul = Record<string, Matkuls>;

export interface RecommendationResult {
    matkuls: Record<string, MataKuliah>; // matkul dengan score (available (store) & selected (message history copy))
    topCategoryKey: string; // "1", "2", etc.
    categories: CategoryResult[];
    category_matkuls?: CategoryMatkul[];
}