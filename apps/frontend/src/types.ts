export interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    showBtnRekomen?: boolean;
    isError?: boolean;
}
 
export interface MataKuliah {
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    dosen: string;
}
 
// export type ChatStep =
//     | "ask_nomor"
//     | "show_options"
//     | "search_matkul"
//     | "confirm_matkul"
//     | "idle";