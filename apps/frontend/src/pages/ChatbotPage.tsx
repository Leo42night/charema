// !!! auto scroll bottom awal load
import axios from "axios";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";

import { useChatPresenter } from "../hooks/useChatPresenter";
import { useChatStore } from "@/stores/useChatStore";
import { useUI } from "../context/UIContext";
import { formatTimestamp } from "@/lib/utils";
import AchievementToast from "@/components/chatbot/AchievementToast";
import MatkulModal from "@/components/chatbot/MatkulModal";
import { ButtonMatkulModal, MessageBubble } from "@/components/chatbot/LittleElements";
import Sidebar from "@/components/chatbot/Sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { BACKEND_URL } from "@/constants";
import { useUIStore } from "@/stores/useUIStore";
import TourGuide from "@/components/TourGuide";
import RekomendasiResult from "@/components/chatbot/RekomendasiMsg";
import { elysiaErr } from "@/lib/elysiaErr";

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
    const [selectedMKIds, setSelectedMKIds] = useState<number[]>([]);

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

    // ── Matkul handlers ───────────────────────────────────────────────────────
    const handleConfirmMK = async () => {
        if (!selectedMKIds.length) return;

        const payload = {
            user_key: user!.user_key,
            matkul_ids: selectedMKIds.map((item) => item),
        };
        try {
            const response = await axios.post(`${BACKEND_URL}/recom-target`, payload);
            toast.success(response.data.message);
            setSelectedMatkulItems(selectedMKIds); // dipakan di about

            // message juga harus berisi category
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsgIndex = newMessages.length - 1;
                if (lastMsgIndex >= 0) {
                    newMessages[lastMsgIndex] = {
                        ...newMessages[lastMsgIndex],
                        selectedMatkulIds: selectedMKIds,
                        showMatkulModal: false,
                    };
                }
                return newMessages;
            });
        } catch (err) {
            elysiaErr(err);
            toast.error("Gagal menyimpan pilihan mata kuliah. Silakan coba lagi.");
        } finally {
            setSelectedMKIds([]);
            setModalOpen(false);
        }
    };

    if (!loaded) return null;

    return (
        <div className="w-full">
            <main className="flex-1 flex flex-col sm:flex-row gap-4 px-3 py-1 sm:p-6 sm:pt-0 max-w-250 mx-auto w-full transition-all duration-300 ease-in-out">
                {/* ── Sidebar ─────────────────────────────────────────────── */}
                <Sidebar
                    isNavbarVisible={isNavbarVisible}
                    setNavbarVisible={setNavbarVisible}
                />

                {/* ── Chat Area ──────────────────────────────────────────── */}
                <div
                    className="main-message relative flex-1 flex flex-col min-w-0 overflow-hidden"
                    // handle mobile responsive untuk virtual keyboard
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

                                    {/* Tabel hasil submit di modal select matkul) */}
                                    {msg.selectedMatkulIds && (
                                        <RekomendasiResult selectedMatkulIds={msg.selectedMatkulIds} />
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
                        {/* goto bottom, apa memang perlu buat elemen ini? */}
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

            {/* Modal */}
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
                    selectedMKIds={selectedMKIds}
                    setSelectedMKIds={setSelectedMKIds}
                    onConfirm={handleConfirmMK}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}