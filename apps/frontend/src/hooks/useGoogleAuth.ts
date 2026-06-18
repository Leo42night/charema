import axios from "axios";
import { useGoogleLogin, type TokenResponse } from "@react-oauth/google";
import { useAuthStore } from "../stores/useAuthStore"; // sesuaikan path store Anda
import type { UserData } from "../types";
import nimToUserJson from "../data/nim_to_user.json"; // sesuaikan path file json Anda
import { toast } from "sonner";
import { BACKEND_URL } from "@/constants";
import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";

// Definisikan tipe untuk map JSON agar TypeScript tidak error
const nimMap: Record<string, number> = nimToUserJson;

export const useGoogleAuth = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const setAuth = useAuthStore((state) => state.setAuth);
    const setFeedbackNumber = useAuthStore((s) => s.setFeedbackNumber)
    const setRecScores = useAuthStore((s) => s.setRecScores)
    const setSelectedMatkulItems = useAuthStore((s) => s.setSelectedMatkulItems)
    const setTags = useChatStore((s) => s.setTags);
    const clearMessages = useChatStore((s) => s.clearMessages);

    const handleGoogleSuccess = async (tokenResponse: TokenResponse) => {
        try {
            setIsLoading(true); // 🚀 Mulai loading sebelum request api berjalan

            // 1. Ambil data profil dari Google API
            const resG = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            const email = resG.data.email.toLowerCase();

            // Regex ini menangkap huruf di depan (jika ada) dan semua angka setelahnya sebelum tanda @
            const nimMatch = email.match(/^([a-zA-Z0-9]+)@/);
            const nim = nimMatch ? nimMatch[1].toUpperCase() : null;
            // 3. Cari user_key berdasarkan NIM di file JSON
            const dummyUserKey = 4404;
            const userKey = nim && nimMap[nim] ? nimMap[nim] :
                (nim === "H1101221016" ? 1369 : dummyUserKey);
            // 519 (siskom), 1369 (sisfo), 4404 = H11ACC3DUMY untuk akun dummy

            console.log("userKey :", userKey);

            const userData: UserData = {
                name: resG.data.name,
                given_name: resG.data.given_name,
                email,
                picture: resG.data.picture,
                user_key: userKey, // Masukkan nilai user_key hasil pencarian
            };
            // console.log("userData", userData);

            // 4. Kirim data ke Backend untuk mendapatkan JWT Token
            const backendRes = await axios.post(`${BACKEND_URL}/auth/google`, {
                access_token: tokenResponse.access_token,
                user_data: userData,
            }); // user_recomTarget_one
            console.log("Response dari backend:", backendRes.data); // Debug: lihat response dari backend

            const jwtToken = backendRes.data.token;

            // 5. Simpan ke Zustand Store (otomatis masuk localStorage jika pakai persist)
            setAuth(userData, jwtToken);
            toast.success(`Anda dapat akses untuk beri kritik chat.`, { position: "top-center" });
            if (userKey === 4404) toast.info(`Akun bukan target, diberi akses Test Public User`);

            // 6. (case user adalah pengguna & rekomendasi ada) simpan recomendation Tampilkan notifikasi dapat akses fitur rekomendasi.
            if (backendRes.data.recommendations) {
                // notif pakai toast sonner
                toast.success(`Anda dapat akses rekomendasi matkul.`, { position: "top-center" });
                const rec: Record<string, number> = backendRes.data.recommendations;
                const sortedScores = Object.entries(rec)
                    .sort(([, a], [, b]) => b - a);
                setRecScores(sortedScores); // matkul, category score, category_matkul
            }

            const dataLoaded: string[] = [];

            if (backendRes.data.user_feedback_number && backendRes.data.user_feedback_number > 0) {
                setFeedbackNumber(backendRes.data.user_feedback_number);
                dataLoaded.push("Feedback");
            }

            if (backendRes.data.user_recomTarget_one) { // jika sudah pernah submit matkul
                // console.log("backendRes.data.user_recomTarget_one", backendRes.data.user_recomTarget_one);
                setSelectedMatkulItems(backendRes.data.user_recomTarget_one.matkul_ids)
                dataLoaded.push("Selected Matkul");
            }

            // jika ada progress achivement
            if (backendRes.data.user_achievement) {
                clearMessages()// reset ulang message, handle tags inconsistent

                if (userKey !== dummyUserKey) {
                    setTags(backendRes.data.user_achievement);
                    dataLoaded.push("Achievement");
                } else {
                    setTags([]);
                }
            }
            if (dataLoaded.length > 0) toast.success(`Riwayat [${dataLoaded.join(', ')}] dimuat.`, { position: "top-center" });

            // console.log("Login berhasil!");
        } catch (err: any) {
            // 1. Cek jika error berasal dari Axios (Response dari Backend)
            if (axios.isAxiosError(err)) {
                console.error("Login Error (Backend):", {
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data, // Ini biasanya berisi detail error dari backend
                    message: err.message
                });

                // Opsional: Tampilkan pesan spesifik ke user via Toast
                const errorDetail = err.response?.data?.message || "Terjadi kesalahan pada server.";
                toast.error(`Gagal Login: ${errorDetail}`, { position: "top-center" });
            }
            // 2. Cek jika error terjadi saat setup request (Network error)
            else if (err.request) {
                toast.error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.", { position: "top-center" });
                console.error("Login Error (Network):", err.request);
            }
            // 3. Error lainnya (Code error/Syntax)
            else {
                toast.error(`Error: ${err.message}`, { position: "top-center" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        // onError: () => console.log("Login Failed"),
    });

    return { login, isLoading };
};