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
            console.log("Update Fitur, reset seluruh data aplikasi");

            // 1. HAPUS STORAGE BAWAAN
            localStorage.clear();
            sessionStorage.clear();
            logout();

            // 2. HAPUS COOKIES (Semua Path & Domain)
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                // Set tanggal kedaluwarsa ke masa lalu untuk memaksa browser menghapusnya
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
            }

            // 3. HAPUS CACHE STORAGE (Service Worker Cache)
            if ('caches' in window) {
                caches.keys().then((names) => {
                    for (let name of names) {
                        caches.delete(name);
                    }
                });
            }

            // 4. HAPUS INDEXEDDB (Site Data Kompleks)
            if ('indexedDB' in window) {
                indexedDB.databases().then((dbs) => {
                    for (let db of dbs) {
                        if (db.name) indexedDB.deleteDatabase(db.name);
                    }
                });
            }

            // 5. UNREGISTER SERVICE WORKER (Jika Ada)
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (let registration of registrations) {
                        registration.unregister();
                    }
                });
            }

            // Setel ulang versi terbaru agar tidak terhapus lagi di pemuatan berikutnya
            localStorage.setItem(VERSION_CONTROL_KEY, STORAGE_VERSION);

            console.log(`Seluruh Cache, Cookie, dan Site Data dibersihkan karena migrasi versi ke: ${STORAGE_VERSION}`);

            // Rekomendasi: Reload halaman agar semua state browser benar-benar bersih dan fresh
            window.location.reload();
        }
    }, []); // Array kosong memastikan pengecekan hanya berjalan 1x saat aplikasi startup
}