import { STORAGE_VERSION } from "@/constants";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

const VERSION_CONTROL_KEY = "storage_v";

export default function useVersionLocalStorage() {
    const logout = useAuthStore((s) => s.logout);
    useEffect(() => {
        // 1. Ambil versi yang saat ini tersimpan di browser user
        const currentVersion = localStorage.getItem(VERSION_CONTROL_KEY);

        // 2. Jika versi berbeda (atau belum pernah ada/null)
        if (currentVersion !== STORAGE_VERSION) {
            console.log("Update Fitur, reset Local Storage")
            // Hapus seluruh data lama di local storage
            localStorage.clear();
            logout();

            // Setel ulang versi terbaru agar tidak terhapus lagi di pemuatan berikutnya
            localStorage.setItem(VERSION_CONTROL_KEY, STORAGE_VERSION);

            console.log(`Local storage dibersihkan karena migrasi versi ke: ${STORAGE_VERSION}`);
        }
    }, []); // Array kosong memastikan pengecekan hanya berjalan 1x saat aplikasi startup
}