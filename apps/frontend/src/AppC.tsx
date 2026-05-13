import { useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Navbar from "./components/Navbar";
import ChatbotPage from "./pages/ChatPage";
import { CYPHER_KEY, AVAILABLE_MATKULS_STORAGE_KEY, USER_STORAGE_KEY } from "./constants";
import { Cipher } from "./lib/utils";
import { toast } from "sonner";
import nim_to_user from "./data/nim_to_user.json";
import type { UserData } from "shared";

interface HistoryMatkul {
    item: number; // ex. 1, 2, 3, dst
    date: number; // ex. 241 (2024 ganjil)
}
interface AvailableMatkul {
    item: number;
    matkul: string;
}



const nimToUser: Record<string, number> = nim_to_user;

function loadLocalStorageSecret(key: string, callback: (data: any) => void) {
    try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            callback(JSON.parse(Cipher.decode(storedData, CYPHER_KEY)));
        } else { // demo, pakai mock user
            // callback(MOCK_USER);
        }
    } catch (err) {
        console.error(`Invalid localStorage ${key}`);
        localStorage.removeItem(key);
    }
}

export default function App() {
    const [user, setUser] = useState<UserData | null>(null);
    // trigger load ini setelah login (dapat NIM dari email)
    const [historyMatkuls, setHistoryMatkuls] = useState<HistoryMatkul[]>([]);
    const [availableMatkuls, setAvailableMatkuls] = useState<AvailableMatkul[]>([]);

    useEffect(() => {
        loadLocalStorageSecret(USER_STORAGE_KEY, setUser);
        loadLocalStorageSecret(AVAILABLE_MATKULS_STORAGE_KEY, setAvailableMatkuls);
    }, []);

    // Handle viewport height untuk mengatasi masalah keyboard di mobile
    useEffect(() => {
        const updateViewport = () => {
            const vv = window.visualViewport;
            if (!vv) return;

            // Kita gunakan vv.height karena ini adalah area yang 'bebas' dari keyboard
            const vh = vv.height * 0.01;
            document.documentElement.style.setProperty("--vh", `${vh}px`);

            // Simpan juga offset-nya untuk menetralkan dorongan layout
            document.documentElement.style.setProperty("--vv-offset", `${vv.offsetTop}px`);
        };

        window.visualViewport?.addEventListener("resize", updateViewport);
        window.visualViewport?.addEventListener("scroll", updateViewport);
        updateViewport();

        return () => {
            window.visualViewport?.removeEventListener("resize", updateViewport);
            window.visualViewport?.removeEventListener("scroll", updateViewport);
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        const fetchRekomendasi = async () => {
            // const user_key = nimToUser[user!.email.split("@")[0]];
            const user_key = 555; // TEST
            console.log("Derived user_key:", user_key);
    
            if (!user_key) {
                toast("Data hanya tersedia untuk mahasiswa UNTAN, Prodi Sistem Infromasi & Rekayasa Sistem Komputer akt 2023-2025.")
                return;
            }
            const token = localStorage.getItem("session_token");
    
            const response = await axios.get(`http://localhost:3000/recom-option/${user_key}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("Rekomendasi matkul:", response.data);
        }
        fetchRekomendasi();
    }, [user]);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log("Access Token:", tokenResponse.access_token);

            try {
                // ambil data user dari Google
                const resG = await axios.get(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                        },
                    }
                );
                console.log("Data User Google:", resG.data);

                // email: "h1101221016@student.untan.ac.id"
                // email_verified: true
                // family_name: "PRANGS TOBING"
                // given_name: "LEO"
                // hd: "student.untan.ac.id"
                // name: "LEO PRANGS TOBING"
                // picture: "https://lh3.googleusercontent.com/a/ACg8ocItZPaKM6xWbFTel2XTVH8DAqzpFaB6jefke-FvIS87qLTgAp4=s96-c"
                // sub: "100201235389108066506"
                // !!! filter berdasarkan data email mahasiswa
                // if (!resG.data.email.endsWith("@student.untan.ac.id")) {
                //     alert("Mohon login dengan email mahasiswa UNTAN");
                //     return;
                // }

                // cari di backend
                const userData: UserData = {
                    name: resG.data.name,
                    given_name: resG.data.given_name,
                    email: resG.data.email,
                    picture: resG.data.picture
                };

                const backendRes = await axios.post("http://localhost:3000/auth/google", {
                    access_token: tokenResponse.access_token,
                    user_data: userData
                });

                const { token } = backendRes.data;

                // Simpan JWT di LocalStorage atau Cookie
                localStorage.setItem("session_token", token);
                console.log("Login Berhasil, JWT tersimpan!");

                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
            } catch (err) {
                console.error(err);
            }
        },
        onError: () => {
            console.log("Login Failed");
        },
    });

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <div
            className="flex flex-col bg-neo-bg dark:bg-zinc-950 overflow-hidden"
            style={{
                // Menggunakan variabel --vh yang kita update via JS (agar elemen chat responsive terhadap keyboard di mobile)
                height: "calc(var(--vh) * 100)"
            }}>
            <Navbar activeMenu="Chatbot" user={user} onLogin={login} onLogout={logout} />
            <ChatbotPage />
        </div>
    );
}