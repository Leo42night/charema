export interface UserData {
    name: string;
    given_name: string;
    email: string;
    picture: string;
    user_key?: number; // from nim in email map into nim_to_user
}

export interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    tag?: string;
    isError?: boolean;
    showMatkulModal?: boolean;
    selectedResults?: MataKuliah[]; // untuk menyimpan pilihan user di modal
    showTourButton?: boolean;
}

export interface MataKuliahData {
    matkul: string;
    dosen: string;
    tahun: number; // tahun riwayat terbaru
    sm: number; // 1 (genap), 7 (ganjil)
    category: number; // label dari training embeding
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


// hasil rekomendasi
export interface CategoryResult {
    category: string;
    name: string;
    totalScore: number;
    count: number;
}

export interface CategoryMatkul {
    semester: number;
    kode: string;
    matkul: string;
    sks: number;
    prasyarat: string | null;
    wajib: number;
    category: number;
}

export interface RecommendationResult {
    matkuls: MataKuliah[],
    categories: CategoryResult[],
    category_matkuls?: CategoryMatkul[]
}