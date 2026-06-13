export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
export const SUGGESTED_PROMPTS = ["Hallo!", "Kamu ini apa?", "Kasih Rekomendasi mata kuliah dong!"];

// local storage keys and cypher key (contant folding akan memakai nilai di env jika ada, jadi fallback value tidak akan pernah dipakai di production, hanya untuk development lokal saja)
export const STORAGE_VERSION = "v1.0.4"; // Bisa diupdate jika ada perubahan besar pada struktur data (reset localStorage browser user)
export const USER_STORAGE_KEY = import.meta.env.VITE_USER_STORAGE_KEY || "user_data";
export const AVAILABLE_MATKULS_STORAGE_KEY = import.meta.env.VITE_AVAILABLE_MATKULS_STORAGE_KEY || "available_matkuls";

// chat model key & achievement key
export const ACHIEVEMENT_TAGS_KEY = import.meta.env.VITE_ACHIEVEMENT_TAGS_KEY || "achievement";
export const TOTAL_TAGS = 10;
export const TUTORIAL_YT = "https://www.youtube.com/embed/dK9PBbyjXdU?rel=0&modestbranding=1"