// src\pages\ChatPage.tsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

import { useChatPresenter } from '../presenters/chat';
// import { sendChatTfjs } from "../aiApi";
// navbar jadikan sebagai sidebar (sebelah kiri), kanan atas ada overlay button avatar user (nama, jurusan, nomor, status, loginHandler, your achievement data)
import { useUI } from "../context/UIContext";
// import type { MataKuliah } from "../types";
// import { ACHIEVEMENT_TAGS_KEY } from "../constants";
import { Sparkles } from "lucide-react";
// import Achievement from "@/components/chatbot/Achivement";

// const TOTAL_TAGS = 8;
// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatbotPage() {
    const hasMounted = useRef(false);

    const { messages, isLoading, error, sendMessage, setMessages } = useChatPresenter();
    // const [tags, setTags] = useState([]);
    // const [percentageAchived, setPercentageAchieved] = useState(0);

    const { setInputFocus, isNavbarVisible, setNavbarVisible } = useUI();

    // const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");

    // Bot state machine
    // const [selectedMK, setSelectedMK] = useState<MataKuliah[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // const fmt = (d: Date) =>
    //     d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    // const updateTags = (predictedTag) => {
    //     setTags((prevTags) => {
    //         if (!prevTags.includes(predictedTag)) {
    //             // Jalankan suara dari folder public/sounds/
    //             audioAchivement.play();

    //             const newTags = [...prevTags, predictedTag];
    //             const percentage = Math.floor((newTags.length / TOTAL_TAGS) * 100);
    //             setPercentageAchieved(percentage);

    //             localStorage.setItem('achievement', JSON.stringify(newTags));

    //             return newTags;
    //         }
    //         return prevTags;
    //     });
    // };

    // -- USEFFECTS --
    // useEffect(() => {
    //     const savedTags = localStorage.getItem(ACHIEVEMENT_TAGS_KEY);
    //     if (savedTags) {
    //         const parsed = JSON.parse(savedTags);
    //         setTags(parsed);
    //         setPercentageAchieved(Math.floor((parsed.length / TOTAL_TAGS) * 100));
    //     }
    // }, []);

    // useEffect(() => {
    //     if (predictedTag) {
    //         updateTags(predictedTag);
    //     }
    // }, [messages]);

    // ── Scroll on new messages ────────────────────────────────────────────────
    useEffect(() => {
        console.log("Messages updated:", messages);
        const lastMsg = messages[messages.length - 1];
        const behavior =
            isLoading || lastMsg?.role === "user" ? "auto" : "smooth";
        messagesEndRef.current?.scrollIntoView({ behavior, block: "nearest" });
    }, [messages, isLoading]);


    // ── Initial greeting ──────────────────────────────────────────────────────
    useEffect(() => {
        if (hasMounted.current) return;
        hasMounted.current = true;
        console.log("Chatbot initialized.", messages);
        setTimeout(() => {
            addBotMsg(
                "Halo! Saya Akademik Bot untuk Mahasiswa.\n Ada yang bisa saya bantu?"
            );
        }, 400);
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const addBotMsg = (
        content: string
    ) => {
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now() + 1,
                role: "assistant",
                content,
                timestamp: new Date().toString()
            },
        ]);
    };

    const resetChat = () => {
        setMessages([]);
        // setSelectedMK([]);
        setTimeout(() => {
            addBotMsg(
                "Chat baru dimulai. Mari mulai dari awal 👍",
            );
        }, 300);
    };

    const msgCount = messages.filter((m) => m.role === "user").length;

    return (
        <main
            className={`
                flex-1 flex flex-col sm:flex-row gap-4 px-3 py-1 sm:p-6 sm:pt-0 max-w-250 mx-auto w-full
                transition-all duration-300 ease-in-out
            `}
        >
            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className="hidden sm:flex sm:pt-6 flex-col gap-4 w-48 shrink-0">
                <div>
                    <span className="text-sm ml-2 tracking-widest uppercase bg-black/50 px-1 rounded">
                        v1.0
                    </span>
                </div>
                <SideCard title="// Action">
                    <button
                        onClick={resetChat}
                        className="neo-btn w-full py-2 mb-2 bg-neo-yellow text-[10px] text-black shadow-neo-sm"
                    >
                        Reset Chat
                    </button>
                    <button
                        onClick={() => setNavbarVisible(!isNavbarVisible)}
                        className={`w-full flex justify-center items-center gap-2 px-2 py-1 transition-all border-2 border-black dark:border-neo-yellow shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-px active:translate-y-px
                            ${isNavbarVisible
                                ? "bg-neo-white-cool dark:bg-zinc-800"
                                : "bg-neo-yellow dark:bg-neo-yellow text-black"}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="4" width="20" height="16" stroke="currentColor" strokeWidth="2.5" />
                            <path d="M2 10H22" stroke="currentColor" strokeWidth="2.5" />
                            {isNavbarVisible ? (
                                <g>
                                    <path d="M7 15C7 15 9 12 12 12C15 12 17 15 17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                                    <path d="M7 15C7 15 9 18 12 18C15 18 17 15 17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                                    <rect x="11" y="14" width="2" height="2" fill="currentColor" />
                                </g>
                            ) : (
                                <g>
                                    <path d="M8 13L16 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
                                    <path d="M16 13L8 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
                                </g>
                            )}
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                            {isNavbarVisible ? "View_Mode" : "Focus_Mode"}
                        </span>
                    </button>
                </SideCard>

                <SideCard title="// Status" className="bg-neo-red">
                    <div className="flex items-center gap-2 font-bold text-xs">
                        <div className="w-2 h-2 bg-neo-green border-2 border-black rounded-full animate-pulse" />
                        Online
                    </div>
                    <div className="text-[10px] mt-1 opacity-80">
                        {msgCount} pesan terkirim
                    </div>
                </SideCard>

                {/* {userData && (
                    <SideCard title="// Session" className="bg-neo-yellow">
                        <div className="font-black text-[11px]">{userData.nama}</div>
                        <div className="text-[9px] mt-0.5 opacity-70">{userData.jurusan}</div>
                        <div className="text-[9px] mt-0.5 font-mono opacity-60">{nomorInduk}</div>
                    </SideCard>
                )} */}

                {/* Mobile Achievements Section */}
                {/* <Achievement percentageAchived={percentageAchived} tags={tags} /> */}
            </aside>

            {/* ── Chat Area ─────────────────────────────────────────────────── */}
            <div
                className="relative flex-1 flex flex-col min-w-0 min-h-0"
                style={{
                    maxHeight: isNavbarVisible
                        ? "calc(var(--vh, 1vh) * 100 - 60px)"
                        : "calc(var(--vh, 1vh) * 100 - 4px)",
                }}
            >
                {/* Messages container */}
                <div className="mb-2 flex-1 min-h-0 p-4 overflow-y-auto flex flex-col gap-4 cb-scrollbar">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${msg === messages[0] ? "mt-8" : ""} flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] sm:max-w-[75%] border-2 border-black p-3 shadow-neo-sm
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
                                <p className="text-sm leading-relaxed whitespace-pre-line">
                                    {msg.content}
                                </p>

                                {/* Quick-reply option buttons */}
                                {/* {msg.options && msg.options.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-1.5">
                                        {msg.options.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => handleOptionClick(opt)}
                                                disabled={loading}
                                                className="neo-btn text-left px-3 py-1.5 bg-white dark:bg-zinc-700 dark:text-white dark:border-neo-yellow
                                                    text-black text-[10px] shadow-neo-sm hover:bg-neo-yellow disabled:opacity-40"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )} */}

                                {/* Inline search widget (only on last search_matkul message) */}
                                {/* {msg.showSearch && msg === messages[messages.length - 1] && (
                                    <SearchMataKuliah
                                        selectedMK={selectedMK}
                                        onToggle={(mk) => {
                                            setSelectedMK((prev) =>
                                                prev.some((s) => s.kode === mk.kode)
                                                    ? prev.filter((s) => s.kode !== mk.kode)
                                                    : [...prev, mk]
                                            );
                                        }}
                                        onRemove={(kode) =>
                                            setSelectedMK((prev) => prev.filter((s) => s.kode !== kode))
                                        }
                                        onConfirm={handleConfirmMK}
                                    />
                                )} */}
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

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 p-2 sm:p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-xs sm:text-sm backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                            {error}
                        </div>
                    </motion.div>
                )}

                {/* Input Section */}
                <div className="shrink-0 bg-neo-bg dark:bg-zinc-950">
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
                                    (e.preventDefault(), sendMessage(input))
                                }
                                placeholder="Type a message..."
                                className="flex-1 p-2 box-content bg-transparent outline-none resize-none text-sm
                                    dark:text-white placeholder:text-zinc-500 overflow-y-hidden"
                                style={{ height: "24px" }}
                            />
                            <button
                                onClick={() => {
                                    sendMessage(input);
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
    );
}

function SideCard({ title, children, className = "bg-white dark:bg-zinc-900" }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`neo-box p-3 dark:border-neo-yellow ${className}`}>
            <div className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black dark:border-neo-yellow pb-2 mb-3">
                {title}
            </div>
            {children}
        </div>
    );
}