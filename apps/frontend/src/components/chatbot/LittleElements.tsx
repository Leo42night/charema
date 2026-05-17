// fragment elemen dari ChatbotPage agar file tidak panjang

import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import axios from "axios";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { MessageSquarePlus, Send } from "lucide-react"; // Ambil ikon pendukung
import { useState } from "react";
import { toast } from "sonner";
import type { Message } from "@/types"
import { BACKEND_URL } from "@/constants";

export const MessageBubble = ({ msg }: { msg: Message }) => {
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackInput, setFeedbackInput] = useState("");
    const messages = useChatStore((state) => state.messages);
    const { user, token, setFeedbackNumber } = useAuthStore();

    const showBtnFeedback = !!user && msg.role === "assistant" && msg.id !== messages[0]?.id

    const handleSendFeedback = async (e: React.SubmitEvent) => {
        // harus login dulu untuk send feedback
        e.preventDefault();
        if (!feedbackInput.trim()) return;

        // Proses pengiriman saran di sini (ke API atau State utama)
        // console.log(`Feedback untuk pesan ${msg.id}:`, feedbackInput);

        // 1. Cari indeks dari pesan bot saat ini (msg) di dalam state
        const currentMsgIndex = messages.findIndex((m) => m.id === msg.id);

        // 2. Berjalan mundur dari indeks tersebut untuk mencari pesan user terakhir
        let user_msg = null;
        for (let i = currentMsgIndex - 1; i >= 0; i--) {
            if (messages[i].role === "user") { // Sesuaikan property "role" atau "sender" dengan skema Anda
                user_msg = messages[i];
                break; // Hentikan perulangan setelah menemukan pesan terdekat
            }
        }

        if (!user_msg) {
            toast.error("Pesan prompt user sebelum pesan ini tidak ditemukan.");
            return;
        }
        const payload = {
            user_key: user!.user_key,
            user_email: user!.user_key ? user!.email : undefined,
            input: user_msg.content,
            res_tag: msg.tag,
            res_message: msg.content,
            feedback: feedbackInput
        };

        console.log(payload);

        //  ambil pesan prompt user sebelum msg ini
        try {
            const response = await axios.post(
                `${BACKEND_URL}/feedback`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        // Hapus baris di bawah jika endpoint tidak butuh login
                        "Authorization": `Bearer ${token}`
                    }
                }
            );
            setFeedbackNumber(response.data.count);
            toast.info("berhasil mengirim feedback.");
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                // Ambil data JSON dari body yang dikirim oleh backend Elysia
                const errorBody = error.response.data;

                console.log(errorBody.error || "Terjadi kesalahan pada server");
                console.log(errorBody.detail || null);
            } else {
                // Jika error terjadi karena jaringan putus atau server mati total
                console.log("Gagal terhubung ke server");
            }
        }

        // Reset form
        setFeedbackInput("");
        setShowFeedback(false);
    };
    return (
        <div className="flex flex-col gap-2 w-full">
            {/* Balon Chat Utama */}
            <div
                className={`border-2 border-black p-3 shadow-neo-sm relative group
                animate-in slide-in-from-${msg.role === "user" ? "right" : "left"}-4
                wrap-break-word overflow-hidden min-w-0
                ${msg.role === "user"
                        ? "bg-black text-neo-yellow dark:bg-neo-yellow dark:text-black dark:border-white"
                        : "bg-neo-yellow text-black dark:bg-zinc-800 dark:text-neo-yellow dark:border-neo-yellow"
                    }`}
            >
                <div className="text-[9px] uppercase font-bold mb-1 opacity-60">
                    {msg.role === "user"
                        ? `User // ${msg.timestamp}`
                        : `System // ${msg.timestamp}`}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line pb-4">
                    {msg.content}
                </p>

                {/* Tombol Beri Masukan di Kanan Bawah */}
                {/* Rules: 1. tidak boleh tampil di msg pertama */}
                {showBtnFeedback && (
                    <button
                        type="button"
                        onClick={() => {
                            setShowFeedback(!showFeedback)
                        }}
                        className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase border transition-all duration-100 active:translate-x-px active:translate-y-px 
                        bg-black text-white border-black hover:bg-zinc-800 dark:bg-neo-yellow dark:text-black dark:border-black"
                    >
                        <MessageSquarePlus className="w-2.5 h-2.5" />
                        <span>{showFeedback ? "Close_In" : "Beri_Kritik"}</span>
                    </button>
                )}
            </div>

            {/* Form Input Saran (Muncul Bersyarat di Bawah Balon Chat) */}
            {showFeedback && msg.role === "assistant" && (
                <form
                    onSubmit={handleSendFeedback}
                    className="animate-in fade-in slide-in-from-top-2 duration-150 flex gap-1.5 w-full bg-neo-white-neutral dark:bg-zinc-900 border-2 border-black p-1.5 shadow-[2px_2px_0_0_#000]"
                >
                    <input
                        type="text"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Apa respon yang benar?"
                        className="flex-1 font-mono text-[11px] px-2 py-1 bg-white dark:bg-zinc-800 border-2 border-black text-black dark:text-white rounded-none focus:outline-none placeholder:text-gray-400"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!feedbackInput.trim()}
                        className="bg-neo-green text-black border-2 border-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-tight flex items-center gap-1 shadow-[1px_1px_0_0_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span className="hidden md:inline">Kirim</span>
                    </button>
                </form>
            )}
        </div>
    )
}

export const ButtonMatkulModal = ({ setModalOpen }: {
    setModalOpen: (open: boolean) => void;
}) => {
    return (
        <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setModalOpen(true)}
            // Menambahkan type button adalah best practice HTML
            type="button"
            className="self-start flex items-center gap-2 px-3 py-2
                 border-2 border-black dark:border-neo-yellow
                 bg-white dark:bg-zinc-900
                 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#facc15]
                 hover:bg-neo-yellow dark:hover:bg-neo-yellow dark:hover:text-black
                 active:shadow-none active:translate-x-px active:translate-y-px
                 transition-all text-[10px] font-black uppercase tracking-widest"
        >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Pilih Mata Kuliah</span>
        </motion.button>
    );
};