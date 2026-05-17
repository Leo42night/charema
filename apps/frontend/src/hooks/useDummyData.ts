import { useEffect } from "react"
import { useAuthStore } from "@/stores/useAuthStore";

export interface UserData {
    name: string;
    given_name: string;
    email: string;
    picture: string;
    user_key: number;
}

export interface MatkulItem {
    item: number;
    nama: string;
    kode: string | null;
    sks: number | null;
    semester: number | null;
    dosen: string | null;
    score: number;
    rank: number;
}

export interface AuthState {
    user: UserData;
    token: string;
    recommendations: Record<string, number>; // Objek dengan key string angka dan value float
    availableMatkuls: MatkulItem[];
}

export interface ZustandStoreDummy {
  state: AuthState;
}


const dummyStoreData: ZustandStoreDummy = {
    state: {
        user: {
            name: "LEO PRANGS TOBING",
            given_name: "LEO",
            email: "h1101221016@student.untan.ac.id",
            picture: "https://lh3.googleusercontent.com/a/ACg8ocItZPaKM6xWbFTel2XTVH8DAqzpFaB6jefke-FvIS87qLTgAp4=s96-c",
            user_key: 555,
        },
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2RhdGEiOnsibmFtZSI6IkxFTyBQUkFOR1MgVE9CSU5HIiwiZW1haWwiOiJoMTEwMTIyMTAxNkBzdHVkZW50LnVudGFuLmFjLmlkIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0l0WlBhS002eFdiRlRlbDJYVFZIOERBcXpwRmFCNmplZmtlLUZ2SVM4N3FMVGdBcDQ9czk2LWMiLCJ1c2VyX2tleSI6NTU1fSwiZXhwIjoxNzc4OTU3OTg0LCJpYXQiOjE3Nzg4NzE1ODR9.WnjKPH9FFMC7xmZ_q41d3KTLf1I2k7neTmkCuhqEUcA",
        recommendations: {
            "5": 0.9928907752037048,
            "10": 0.9938141703605652,
            "14": 0.9983448386192322,
            "16": 0.9930275678634644,
            "17": 0.9837746620178223,
            "27": 0.9703015089035034,
            "34": 0.9927857518196106,
            "35": 0.9936895966529846,
            "38": 0.9929900169372559,
            "39": 0.9807093143463135,
            "40": 0.9681379795074463,
            "41": 0.9571886658668518,
            "47": 0.9944066405296326,
            "51": 0.9982528686523438,
            "52": 0.9372826218605042,
            "54": 0.9922341108322144,
            "56": 0.92201167345047,
            "60": 0.9889644384384155,
            "61": 0.9953576922416687,
            "64": 0.9673973321914673,
            "65": 0.9682861566543579,
            "76": 0.9958118796348572,
            "77": 0.9700818061828613,
            "80": 0.9895435571670532,
            "85": 0.9733029007911682,
            "86": 0.9867023825645447,
            "88": 0.9866132736206055,
            "106": 0.9721126556396484,
            "114": 0.9875331521034241,
            "117": 0.9987214207649231,
            "118": 0.9981526732444763,
            "119": 0.9788674712181091,
            "121": 0.9951387643814087,
            "126": 0.9829633831977844,
            "128": 0.9960571527481079,
            "129": 0.9970457553863525,
            "136": 0.9963768720626831,
            "139": 0.9934306740760803,
            "141": 0.9882173538208008,
            "144": 0.9942262768745422,
            "147": 0.9846735000610352,
            "148": 0.9959077835083008,
            "149": 0.9937667846679688,
            "152": 0.985565721988678,
            "154": 0.987055778503418,
            "158": 0.9931771755218506,
            "159": 0.9364928007125854,
            "162": 0.9838272333145142,
            "175": 0.9870909452438354,
            "182": 0.9546464085578918,
            "185": 0.9780504107475281,
            "186": 0.9969330430030823,
            "187": 0.9900244474411011,
            "197": 0.9959543347358704,
            "198": 0.9871554970741272,
            "203": 0.978268027305603,
            "204": 0.9954500794410706,
            "207": 0.9946978688240051,
            "209": 0.996087372303009,
            "210": 0.996042013168335,
            "222": 0.9944226741790771,
            "223": 0.9884747862815857,
            "224": 0.9583280086517334,
            "227": 0.9919673800468445,
            "228": 0.9887045621871948,
        },
        availableMatkuls: [
            {
                item: 117,
                nama: "PANCASILA",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9987214207649231,
                rank: 1,
            },
            {
                item: 14,
                nama: "Bahasa Indonesia",
                kode: "MKWK4",
                sks: 2,
                semester: 1,
                dosen: null,
                score: 0.9983448386192322,
                rank: 2,
            },
            {
                item: 51,
                nama: "Jaringan Komputer Lanjut",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9982528686523438,
                rank: 3,
            },
            {
                item: 118,
                nama: "Pancasila",
                kode: "MKWK2",
                sks: 2,
                semester: 2,
                dosen: null,
                score: 0.9981526732444763,
                rank: 4,
            },
            {
                item: 129,
                nama: "Pemrograman Multimedia & Animasi",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9970457553863525,
                rank: 5,
            },
            {
                item: 186,
                nama: "Semester Proyek 1",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9969330430030823,
                rank: 6,
            },
            {
                item: 136,
                nama: "Pemrosesan Pararel",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9963768720626831,
                rank: 7,
            },
            {
                item: 209,
                nama: "Sistem Tertanam Lanjut",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.996087372303009,
                rank: 8,
            },
            {
                item: 128,
                nama: "Pemrograman Mobile",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9960571527481079,
                rank: 9,
            },
            {
                item: 210,
                nama: "Sistem Waktu Nyata",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.996042013168335,
                rank: 10,
            },
            {
                item: 197,
                nama: "Sistem Informasi Bergerak",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9959543347358704,
                rank: 11,
            },
            {
                item: 148,
                nama: "Pengenalan Teknologi Informasi",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9959077835083008,
                rank: 12,
            },
            {
                item: 76,
                nama: "Komputer dan Masyarakat",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9958118796348572,
                rank: 13,
            },
            {
                item: 204,
                nama: "Sistem Mikroprosesor",
                kode: null,
                sks: null,
                semester: null,
                dosen: null,
                score: 0.9954500794410706,
                rank: 14,
            },
        ],
    }
};

export const useDummyData = () => {
    const { user, setAuth, setRecommendations, setAvailableMatkuls } = useAuthStore();

    useEffect(() => {
        // 1. Taruh alert/log di paling atas untuk memastikan hook aktif
        // console.log("Status user saat ini:", user);
        // alert("useEffect Berhasil Dipicu!");

        // 2. Cek apakah user sudah terisi data dummy
        if (user && user.email === "h1101221016@student.untan.ac.id") {
            console.log("Data dummy sudah terpasang, menghentikan eksekusi.");
            return;
        }

        // 3. Pasang data dummy jika belum ada
        if (dummyStoreData?.state) {
            const { state } = dummyStoreData;
            setAuth(state.user, state.token);
            setRecommendations(state.recommendations);
            setAvailableMatkuls(state.availableMatkuls);
            alert("Data dummy berhasil dimasukkan ke store!");
        }
    }, [user, setAuth, setRecommendations, setAvailableMatkuls]); 
}