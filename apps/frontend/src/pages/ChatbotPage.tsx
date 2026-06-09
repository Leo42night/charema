// src/pages/ChatPage.tsx
import { useState, useRef, useEffect } from "react";
import { ArrowRight, MapPin } from "lucide-react";

import { useChatPresenter } from "../hooks/useChatPresenter";
import { useChatStore } from "@/stores/useChatStore";
import { useUI } from "../context/UIContext";
import { formatTimestamp } from "@/lib/utils";
import AchievementToast from "@/components/chatbot/AchievementToast";
import MatkulModal from "@/components/chatbot/MatkulModal";
import type { MataKuliah } from "@/types";
import { ButtonMatkulModal, MessageBubble } from "@/components/chatbot/LittleElements";
import Sidebar from "@/components/chatbot/Sidebar";
import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { BACKEND_URL } from "@/constants";
import { useUIStore } from "@/stores/useUIStore";
import TourGuide from "@/components/TourGuide";

export default function ChatbotPage() {
    // store state
    const user = useAuthStore((state) => state.user);
    const toastTag = useChatStore((s) => s.toastTag);
    const messages = useChatStore((s) => s.messages);
    const setSelectedMatkulItems = useAuthStore((state) => state.setSelectedMatkulItems);
    const setMenuOpen = useUIStore((s) => s.setMenuOpen);
    const dismissToast = useChatStore((s) => s.dismissToast);
    const setMsgCount = useUIStore((s) => s.setMsgCount);

    // logic presenter
    const { setMessages, isLoading, sendMessage } = useChatPresenter();
    const { setInputFocus, isNavbarVisible, setNavbarVisible } = useUI();

    const hasMounted = useRef(false);
    const [startTour, setStartTour] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const [input, setInput] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMK, setSelectedMK] = useState<MataKuliah[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── Initial greeting ───────────────────────────────────────────────────────
    useEffect(() => {
        if (hasMounted.current) return;
        hasMounted.current = true;
        setLoaded(true);

        if (messages.length > 0) return;
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    content: "Halo! Saya Akademik Bot untuk Mahasiswa.\nAda yang bisa saya bantu?",
                    timestamp: formatTimestamp(Date.now()),
                    showTourButton: true, // flag untuk render tombol tour
                },
            ]);
        }, 400);
    }, []);

    // ── Scroll on new messages ─────────────────────────────────────────────────
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        const behavior = isLoading || lastMsg?.role === "user" ? "auto" : "smooth";
        messagesEndRef.current?.scrollIntoView({ behavior, block: "nearest" });
    }, [messages, isLoading]);

    useEffect(() => {
        setMsgCount(messages.filter((m) => m.role === "user").length);
    }, [messages.length]);

    // ── Matkul handlers ────────────────────────────────────────────────────────
    const handleToggleMK = (mk: MataKuliah) => {
        setSelectedMK((prev) =>
            prev.some((s) => s.item === mk.item)
                ? prev.filter((s) => s.item !== mk.item)
                : [...prev, mk]
        );
    };

    const handleRemoveMK = (item: number) => {
        setSelectedMK((prev) => prev.filter((s) => s.item !== item));
    };

    const handleConfirmMK = async () => {
        if (!selectedMK.length) return;

        const payload = {
            user_key: user!.user_key,
            matkuls: selectedMK.map((mk) => mk.item),
        };

        const response = await axios.post(`${BACKEND_URL}/recom-target`, payload);

        if (response.data.message) {
            toast.success(response.data.message);
        } else {
            toast.error("Gagal menyimpan pilihan mata kuliah. Silakan coba lagi.");
            return;
        }

        const finalSelection = [...selectedMK];
        setSelectedMatkulItems(finalSelection.map((s) => s.item));

        setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsgIndex = newMessages.length - 1;
            if (lastMsgIndex >= 0) {
                newMessages[lastMsgIndex] = {
                    ...newMessages[lastMsgIndex],
                    selectedResults: finalSelection,
                    showMatkulModal: false,
                };
            }
            return newMessages;
        });

        setSelectedMK([]);
        setModalOpen(false);
    };

    if (!loaded) return null;

    return (
        <div className="w-full">
            {startTour && (
                <TourGuide
                    start={startTour}
                    setStartTour={setStartTour}
                    onOpenDrawer={() => setMenuOpen(true)}
                    onTourEnd={() => setStartTour(false)}
                    onCloseDrawer={() => setMenuOpen(false)}
                />
            )}

            <AchievementToast tag={toastTag} onDismiss={dismissToast} />

            {modalOpen && (
                <MatkulModal
                    selectedMK={selectedMK}
                    onToggle={handleToggleMK}
                    onRemove={handleRemoveMK}
                    onConfirm={handleConfirmMK}
                    onClose={() => setModalOpen(false)}
                />
            )}

            <main className="flex-1 flex flex-col sm:flex-row gap-4 px-3 py-1 sm:p-6 sm:pt-0 max-w-250 mx-auto w-full transition-all duration-300 ease-in-out">
                {/* ── Sidebar ─────────────────────────────────────────────── */}
                <Sidebar
                    isNavbarVisible={isNavbarVisible}
                    setNavbarVisible={setNavbarVisible}
                />

                {/* ── Chat Area ──────────────────────────────────────────── */}
                <div
                    className="main-message relative flex-1 flex flex-col min-w-0 overflow-hidden"
                    style={{
                        maxHeight: isNavbarVisible
                            ? "calc(var(--vh, 1vh) * 100 - 60px)"
                            : "calc(var(--vh, 1vh) * 100 - 4px)",
                    }}
                >
                    {/* Messages container */}
                    <div className="mb-2 flex-1 min-h-0 p-4 overflow-y-auto flex flex-col gap-4 cb-scrollbar">
                        {messages.map((msg, msgIdx) => (
                            <div
                                key={msg.id}
                                className={`${msgIdx === 0 ? "mt-8" : ""} flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className="flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]">
                                    <MessageBubble msg={msg} />

                                    {/* ── BTN Start Tour — hanya di pesan pertama bot ── */}
                                    {msg.showTourButton && (
                                        <button
                                            onClick={() => setStartTour(true)}
                                            className="self-start flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-neo-yellow
                                                bg-neo-yellow text-black text-[10px] font-black uppercase tracking-wider
                                                shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#facc15]
                                                hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                                        >
                                            <MapPin size={11} strokeWidth={3} />
                                            Mulai Tour
                                        </button>
                                    )}

                                    {/* Btn Open Modal Select Matkul */}
                                    {msg.showMatkulModal && (
                                        <ButtonMatkulModal setModalOpen={setModalOpen} />
                                    )}

                                    {/* Tabel hasil selectedResults */}
                                    {msg.selectedResults && msg.selectedResults.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex justify-between items-end px-1 opacity-50 font-black text-[9px] uppercase tracking-tighter">
                                                <span>Mata Kuliah Terpilih</span>
                                                <span>Rank / Score</span>
                                            </div>

                                            {msg.selectedResults.map((mk, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#facc15]"
                                                >
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <div className="text-[11px] font-black leading-tight truncate">{mk.matkul}</div>
                                                        <div className="flex flex-wrap gap-2 text-[9px] opacity-70 items-center">
                                                            {mk.kode && (
                                                                <span className="px-1 py-px border border-black dark:border-current font-bold">
                                                                    {mk.kode}
                                                                </span>
                                                            )}
                                                            {mk.sks != null && <span>{mk.sks} SKS</span>}
                                                            {mk.semester != null && <span>Smt {mk.semester}</span>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 ml-4 shrink-0">
                                                        <div className="flex flex-col items-end text-right">
                                                            <span className="text-[8px] font-black uppercase opacity-50">Rank</span>
                                                            <span className="text-md font-black italic">#{mk.rank || "-"}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end min-w-10 py-1 px-2 bg-neo-yellow text-black border-l-2 border-black shadow-[-2px_0_0_0_#000]">
                                                            <span className="text-[7px] font-black uppercase">Score</span>
                                                            <span className="text-[11px] font-black">
                                                                {mk.score ? (mk.score * 100).toFixed(2) + "%" : "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="mt-2 flex justify-center">
                                                <button
                                                    onClick={() => (window.location.href = "/about")}
                                                    className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest hover:text-neo-yellow transition-colors"
                                                >
                                                    <span className="border-b-2 border-black dark:border-neo-yellow pb-0.5">
                                                        Lihat detail score di halaman about
                                                    </span>
                                                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-neo-yellow dark:bg-zinc-800 border-2 border-black dark:border-neo-yellow p-3 shadow-neo-sm flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-black dark:bg-neo-yellow rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.2}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Section */}
                    <div className="mb-4 md:mb-0 shrink-0 bg-neo-bg dark:bg-zinc-950 pb-[env(safe-area-inset-bottom,0px)]">
                        <div className="flex flex-col gap-1">
                            <div className="neo-box flex items-stretch overflow-hidden bg-white dark:bg-zinc-900 dark:border-neo-yellow">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onFocus={() => setInputFocus(true)}
                                    onBlur={() => setInputFocus(false)}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        const t = e.target;
                                        t.style.height = "24px";
                                        if (t.scrollHeight > 24)
                                            t.style.height = `${t.scrollHeight - 16}px`;
                                    }}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        !e.shiftKey &&
                                        (e.preventDefault(), sendMessage(input), setInput(""))
                                    }
                                    placeholder="Type a message..."
                                    className="flex-1 p-2 box-content bg-transparent outline-none resize-none text-sm
                                        dark:text-white placeholder:text-zinc-500 overflow-y-hidden"
                                    style={{ height: "24px" }}
                                />
                                <button
                                    onClick={() => {
                                        sendMessage(input);
                                        setInput("");
                                        textareaRef.current?.focus();
                                    }}
                                    disabled={isLoading || !input.trim()}
                                    className="neo-btn shrink-0 w-15 bg-black text-neo-yellow border-y-0 border-r-0 border-l-neo
                                        dark:border-neo-yellow dark:bg-neo-yellow dark:text-black rounded-none
                                        disabled:bg-gray-400 dark:disabled:bg-zinc-700"
                                >
                                    ↑
                                </button>
                            </div>
                            <p className="hidden sm:block text-[9px] text-gray-500 dark:text-zinc-500 text-center uppercase tracking-tighter">
                                Shift + Enter for new line
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}