import { STORAGE_VERSION_KEY } from "@/constants";
import { useEffect } from "react";

const VERSION_CONTROL_KEY = "storage_v";

export default function useVersionLocalStorage() {
    useEffect(() => {
        // 1. Ambil versi yang saat ini tersimpan di browser user
        const currentVersion = localStorage.getItem(VERSION_CONTROL_KEY);

        // 2. Jika versi berbeda (atau belum pernah ada/null)
        if (currentVersion !== STORAGE_VERSION_KEY) {
            // Hapus seluruh data lama di local storage
            localStorage.clear();

            // Setel ulang versi terbaru agar tidak terhapus lagi di pemuatan berikutnya
            localStorage.setItem(VERSION_CONTROL_KEY, STORAGE_VERSION_KEY);

            console.log(`Local storage dibersihkan karena migrasi versi ke: ${STORAGE_VERSION_KEY}`);
        }
    }, []); // Array kosong memastikan pengecekan hanya berjalan 1x saat aplikasi startup
}