export interface UserData {
    name: string;
    given_name: string;
    email: string;
    picture: string;
    user_key?: number; // derived from email/NIM, used for backend requests
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
}
 
export interface MataKuliah {
    item: number; // unique identifier dari training dataset item.
    nama: string;
    kode?: string | null;
    sks?: number | null;
    semester?: number | null;
    dosen?: string | null;
    score?: number | null; // untuk rekomendasi, bisa diisi dengan skor relevansi dari backend
    rank?: number | null; // untuk rekomendasi, bisa diisi dengan peringkat berdasarkan skor seluruh data recommendations
}

export interface NilaiPrasyaratEntry {
    semester: number;
    kode: string;
    matkul: string;
    sks: number;
    item: number;
}


interface RatingData {
    score_cf: number;
    score_chat: number;
}

export interface AuthState {
    user: UserData | null;
    token: string | null;
    recommendations: Record<number, number> | null;
    availableMatkuls: MataKuliah[]; 
    setAvailableMatkuls: (updater: MataKuliah[]) => void;
    selectedMatkulItems: number[];
    setSelectedMatkulItems: (items: number[]) => void;
    rating: RatingData | null;

    feedbackNumber: number; // ambil dari database backend
    setFeedbackNumber: (updater: number | ((prev: number) => number)) => void;


    setRecommendations: (recs: Record<number, number>) => void;
    setRating: (rating: RatingData) => void;
    setAuth: (user: UserData, token: string) => void;
    logout: () => void;
}