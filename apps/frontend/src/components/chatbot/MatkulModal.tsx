// src/components/chatbot/MatkulModal.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import type { MataKuliah } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { filterMatkul } from "@/lib/utils";


// ── Component ──────────────────────────────────────────────────────────────────
export default function MatkulModal({
    selectedMK,
    onToggle,
    onRemove,
    onConfirm,
    onClose,
}: {
    selectedMK: MataKuliah[];
    onToggle: (mk: MataKuliah) => void;
    onRemove: (item: number) => void;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const availableMatkuls = useAuthStore((s) => s.availableMatkuls);

    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Filter lokal — tidak perlu async karena data sudah di-memo
    const results = useMemo(() => {
        if (!keyword.trim()) return availableMatkuls;
        return filterMatkul(availableMatkuls, keyword);
    }, [keyword, availableMatkuls]);

    const handleSearch = () => {
        // Trigger re-render dengan loading flash sekedar UX feedback
        setLoading(true);
        setTimeout(() => setLoading(false), 120);
    };

    const totalSKS = selectedMK.reduce((a, m) => a + (m.sks || 0), 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full sm:max-w-lg max-h-[90dvh] flex flex-col bg-neo-bg dark:bg-zinc-950 border-2 border-black dark:border-neo-yellow shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#facc15]">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b-2 border-black dark:border-neo-yellow shrink-0">
                    <div className="flex flex-col">
                        <span className="font-black uppercase tracking-widest text-xs">
                            pilih minimal 10 mata kuliah favorit anda
                        </span>
                        {availableMatkuls.length > 0 && (
                            <span className="text-[9px] opacity-50 mt-0.5">
                                {availableMatkuls.length} MK direkomendasikan
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="neo-btn w-8 h-8 flex items-center justify-center bg-neo-red text-white text-sm border-black dark:border-neo-yellow"
                    >
                        ✕
                    </button>
                </div>

                {/* Search bar */}
                <div className="p-3 border-b-2 border-black dark:border-neo-yellow shrink-0">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder="Filter nama / kode / dosen..."
                            className="flex-1 neo-box px-2 py-1.5 text-[11px] font-mono bg-white dark:bg-zinc-900 dark:border-neo-yellow dark:text-white focus:outline-none"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="neo-btn px-3 py-1.5 bg-neo-yellow text-black text-[10px] shadow-neo-sm"
                        >
                            {loading ? "..." : "CARI"}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto cb-scrollbar min-h-0">
                    {availableMatkuls.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            Belum ada rekomendasi tersedia
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            Tidak ditemukan
                        </div>
                    ) : (
                        results.map((mk) => {
                            const isSel = selectedMK.some(
                                (s) => s.nama === mk.nama && s.item === mk.item
                            );
                            return (
                                <div
                                    key={mk.item}
                                    onClick={() => onToggle(mk)}
                                    className={`border-b-2 border-black dark:border-neo-yellow p-3 cursor-pointer flex justify-between items-center transition-all
                                        ${isSel
                                            ? "bg-neo-yellow dark:bg-neo-yellow dark:text-black"
                                            : "bg-white dark:bg-zinc-900 dark:text-white hover:bg-yellow-50 dark:hover:bg-zinc-800"
                                        }`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="text-[11px] font-black leading-tight">
                                            {mk.nama}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-[9px] opacity-70">
                                            {mk.kode && (
                                                <span className="px-1 py-px border border-black dark:border-current">
                                                    {mk.kode}
                                                </span>
                                            )}
                                            {mk.sks != null && <span>{mk.sks} SKS</span>}
                                            {mk.semester != null && <span>Smt {mk.semester}</span>}
                                            {mk.dosen && (
                                                <span className="truncate max-w-35">{mk.dosen}</span>
                                            )}
                                        </div>
                                    </div>
                                    {isSel && <span className="font-black text-sm ml-2 shrink-0">✓</span>}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Selected summary + confirm */}
                <div className="shrink-0 border-t-2 border-black dark:border-neo-yellow">
                    {selectedMK.length > 0 && (
                        <div className="p-3 bg-white dark:bg-zinc-900 flex flex-col gap-2 border-b-2 border-black dark:border-neo-yellow">
                            <div className="flex justify-between text-[10px] font-black">
                                <span>{selectedMK.length} MK dipilih</span>
                                <span>Total: {totalSKS} SKS</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {selectedMK.map((mk, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1 bg-neo-yellow text-black border-2 border-black px-1.5 py-0.5 text-[9px] font-mono font-black"
                                    >
                                        <span>{mk.kode ? `${mk.kode} — ` : ""}{mk.nama}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemove(mk.item); }}
                                            className="font-black text-red-700 hover:text-red-900 leading-none ml-1"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="p-3 flex gap-2">
                        <button
                            onClick={onClose}
                            className="neo-btn flex-1 py-2.5 bg-white dark:bg-zinc-900 dark:text-white text-[10px] shadow-neo-sm border-black dark:border-neo-yellow"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            disabled={!selectedMK.length || selectedMK.length < 10}
                            className="neo-btn flex-1 py-2.5 bg-black text-neo-yellow text-[10px] shadow-neo-sm disabled:opacity-40 disabled:cursor-not-allowed dark:bg-neo-yellow dark:text-black dark:border-neo-yellow"
                        >
                            KONFIRMASI ({selectedMK.length}/10) ↑
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}