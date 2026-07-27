import { STORAGE_VERSION } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useUIStore } from '@/stores/useUIStore';
import { Star } from 'lucide-react';
import { useState } from "react";
import TooltipAchiev from './TooltipAchiev';

function ConfirmResetModal({
    open,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xs p-4 border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#facc15] flex flex-col gap-3">
                <span className="text-sm font-black text-black dark:text-white">
                    Reset Chat?
                </span>
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Chat dan unlocked tags akan ter reset. Tindakan ini tidak bisa dibatalkan.
                </span>

                <div className="flex gap-2 mt-2">
                    <button
                        onClick={onCancel}
                        className="neo-btn flex-1 py-2 bg-white dark:bg-zinc-700 text-xxs text-black dark:text-white shadow-neo-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="neo-btn flex-1 py-2 bg-red-500 text-xxs text-white shadow-neo-sm"
                    >
                        Ya, Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

const SidebarBtn = ({
    isNavbarVisible,
    setNavbarVisible,
    chatPresenter,
    isOnline,
    setModalScore,
    className
}: {
    isNavbarVisible: boolean;
    setNavbarVisible: (visible: boolean) => void;
    chatPresenter: any;
    isOnline: boolean;
    setModalScore: (modal: boolean) => void;
    className?: string;
}) => {
    const user = useAuthStore((state) => state.user);
    const rating = useAuthStore((s) => s.rating);
    const chatType = useChatStore((s) => s.chatType);
    const setChatType = useChatStore((s) => s.setChatType);
    const msgCount = useUIStore((s) => s.msgCount);
    const resetChat = useUIStore((s) => s.resetChat);
    const hasBeenCalonWinner = useUIStore((s) => s.hasBeenCalonWinner);


    const [showResetConfirm, setShowResetConfirm] = useState(false);

    return (
        <div className={`${className} dark:border-neo-yellow bg-white dark:bg-zinc-900`}>
            <div className="flex items-center justify-between text-xxs font-bold uppercase tracking-widest border-b-2 border-black dark:border-neo-yellow pb-2 mb-3">
                <span>{`${msgCount} Pesan`}</span>
                <span className="bg-neo-yellow text-black px-1.5 py-0.5 rounded-none font-bold">
                    {STORAGE_VERSION}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => setShowResetConfirm(true)}
                    className="neo-btn py-2 bg-neo-yellow text-xxs text-black shadow-neo-sm"
                >
                    Reset Chat
                </button>
                <button
                    onClick={() => setNavbarVisible(!isNavbarVisible)}
                    className={`flex self-baseline py-1 justify-center items-center gap-2 px-2 transition-all border-2 border-black dark:border-neo-yellow shadow-neo-yellow active:shadow-none active:translate-x-px active:translate-y-px
                    ${isNavbarVisible
                            ? "bg-neo-white-cool dark:bg-zinc-800"
                            : "bg-neo-yellow dark:bg-neo-yellow text-black"}`}
                >
                    <svg
                        className={`w-4 h-4 shrink-0 ${isNavbarVisible ? '' : 'text-red-500'}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
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
                    <span className="text-xxs font-black uppercase tracking-tighter">
                        {isNavbarVisible ? "View_Mode" : "Focus_Mode"}
                    </span>
                </button>
                <div className="w-full h-min py-2.5 flex justify-between items-center bg-black text-white px-2 font-mono text-xxs font-black uppercase tracking-wider">
                    {isOnline ? (
                        <>
                            <div className="w-2 h-2 bg-neo-green border-2 border-black rounded-full animate-pulse" />
                            Online
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 bg-neo-red border-2 border-black rounded-full" />
                            Offline
                        </>
                    )}
                </div>
                {user && (
                    <button
                        onClick={() => setModalScore(true)}
                        disabled={!isOnline}
                        className={`relative w-full font-mono text-xxs font-black uppercase tracking-tight py-2 text-center border-2 border-black transition-all
                            ${!isOnline
                                ? "bg-gray-400 text-gray-700 cursor-not-allowed shadow-none translate-x-px translate-y-px"
                                : "bg-neo-purple text-white shadow-neo-yellow hover:bg-opacity-90 active:shadow-none active:translate-x-0.5 active:translate-y-0.5"
                            }`}
                    >
                        {!isOnline ? "SYS_OFFLINE" : "BERI_RATING"}

                        <Star
                            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 ${rating !== null
                                ? "fill-neo-yellow stroke-black"
                                : "fill-white stroke-black"
                                }`}
                        />
                    </button>
                )}
            </div>

            {/* Chatbot type selector */}
            <div className="w-full mt-2">
                <p className="text-xxs font-black uppercase tracking-wider mb-1 text-black dark:text-neo-yellow">
                    Model_Engine
                </p>
                <div className="grid grid-cols-2 border-2 border-black shadow-neo-sm overflow-hidden">
                    <button
                        onClick={() => setChatType("tfjs")}
                        className={`py-1 text-xs font-black uppercase tracking-tighter transition-all border-r-2 border-black
                ${chatType === "tfjs"
                                ? "bg-neo-yellow text-black"
                                : "bg-neo-white-cool dark:bg-zinc-800 text-black dark:text-white"}`}
                    >
                        TF.JS
                    </button>
                    {/* LLM hanya dapat dipilih apabila berhasil unlock min. 15 tags */}
                    <div className="relative">
                        <button
                            onClick={() => hasBeenCalonWinner && setChatType("llm")}
                            disabled={!hasBeenCalonWinner}
                            className={`w-full flex items-center justify-center py-1 text-xs font-black uppercase tracking-tighter transition-all
                                    ${!hasBeenCalonWinner
                                    ? "bg-neutral-200 text-neutral-400 dark:bg-zinc-900 dark:text-neutral-600 cursor-not-allowed"
                                    : chatType === "llm"
                                        ? "bg-neo-yellow text-black"
                                        : "bg-neo-white-cool dark:bg-zinc-800 text-black dark:text-white"}`}
                        >
                            LLM
                        </button>
                        {!hasBeenCalonWinner &&
                            <div className="absolute top-1 right-1 z-10">
                                <TooltipAchiev
                                    tooltipText={
                                        hasBeenCalonWinner
                                            ? "Akses LLM hanya untuk Calon Winner. Lihat halaman About!"
                                            : "Belum unlock. Selesaikan syarat di halaman About untuk akses LLM!"
                                    }
                                />
                            </div>
                        }
                    </div>
                </div>
            </div>

            <ConfirmResetModal
                open={showResetConfirm}
                onConfirm={() => {
                    resetChat(chatPresenter);
                    setShowResetConfirm(false);
                    // setMenuOpen(false); // Tutup drawer setelah reset
                }}
                onCancel={() => setShowResetConfirm(false)}
            />
        </div>
    )
}

export default SidebarBtn