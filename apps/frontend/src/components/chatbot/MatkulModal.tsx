import { useState, useRef, useEffect } from "react";
import type { MataKuliah } from "../../types";
import { AVAILABLE_MATKULS_STORAGE_KEY } from "@/constants";

function searchMataKuliah(keyword: string): MataKuliah[] {
    // ambil data dari JSON local storage (yang sudah di-fetch dari API saat login)
    const storedMatkuls = localStorage.getItem(AVAILABLE_MATKULS_STORAGE_KEY);
    if (!storedMatkuls) return [];
    const availableMatkuls: MataKuliah[] = JSON.parse(storedMatkuls);
    
    return availableMatkuls.filter((mk) => {
        return (
            mk.nama.toLowerCase().includes(keyword.toLowerCase()) ||
            mk.kode.toLowerCase().includes(keyword.toLowerCase()) ||
            mk.dosen.toLowerCase().includes(keyword.toLowerCase())
        );
    });
}

// ─── Dummy async helpers ──────────────────────────────────────────────────────

// const searchMataKuliah = async (keyword: string): Promise<MataKuliah[]> => {
//     await new Promise((r) => setTimeout(r, 400));
//     const kw = keyword.toLowerCase();
//     return dummyMataKuliah.filter(
//         (m) =>
//             m.nama.toLowerCase().includes(kw) ||
//             m.kode.toLowerCase().includes(kw) ||
//             m.dosen.toLowerCase().includes(kw)
//     );
// };

// const submitMataKuliah = async (list: MataKuliah[]) => {
//     await new Promise((r) => setTimeout(r, 900));
//     console.log("Submit:", list);
//     return { success: true };
// };

export default function MatkulModal({
    selectedMK,
    onToggle,
    onRemove,
    onConfirm,
    onClose,
}: {
    selectedMK: MataKuliah[];
    onToggle: (mk: MataKuliah) => void;
    onRemove: (kode: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState<MataKuliah[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
 
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
 
    const handleSearch = async () => {
        if (!keyword.trim()) return;
        setLoading(true);
        const res = await searchMataKuliah(keyword);
        setResults(res);
        setLoading(false);
    };
 
    const totalSKS = selectedMK.reduce((a, m) => a + m.sks, 0);
 
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full sm:max-w-lg max-h-[90dvh] flex flex-col bg-neo-bg dark:bg-zinc-950 border-2 border-black dark:border-neo-yellow shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#facc15]">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b-2 border-black dark:border-neo-yellow shrink-0">
                    <span className="font-black uppercase tracking-widest text-xs">
                        // Pilih Mata Kuliah
                    </span>
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
                            placeholder="Nama / kode / dosen..."
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
                    {results.length === 0 && (
                        <div className="p-6 text-center text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            {loading ? "Mencari..." : "Ketik lalu tekan CARI"}
                        </div>
                    )}
                    {results.map((mk) => {
                        const isSel = selectedMK.some((s) => s.kode === mk.kode);
                        return (
                            <div
                                key={mk.kode}
                                onClick={() => onToggle(mk)}
                                className={`border-b-2 border-black dark:border-neo-yellow p-3 cursor-pointer flex justify-between items-center transition-all
                                    ${isSel
                                        ? "bg-neo-yellow dark:bg-neo-yellow dark:text-black"
                                        : "bg-white dark:bg-zinc-900 dark:text-white hover:bg-yellow-50 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                <div>
                                    <div className="text-[10px] font-black">
                                        {mk.kode} — {mk.nama}
                                    </div>
                                    <div className="text-[9px] opacity-60">
                                        {mk.sks} SKS • Smt {mk.semester} • {mk.dosen}
                                    </div>
                                </div>
                                {isSel && <span className="font-black text-sm ml-2">✓</span>}
                            </div>
                        );
                    })}
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
                                {selectedMK.map((mk) => (
                                    <div
                                        key={mk.kode}
                                        className="flex items-center gap-1 bg-neo-yellow text-black border-2 border-black px-1.5 py-0.5 text-[9px] font-mono font-black"
                                    >
                                        <span>{mk.kode}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemove(mk.kode); }}
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
                            disabled={!selectedMK.length}
                            className="neo-btn flex-1 py-2.5 bg-black text-neo-yellow text-[10px] shadow-neo-sm disabled:opacity-40 disabled:cursor-not-allowed dark:bg-neo-yellow dark:text-black dark:border-neo-yellow"
                        >
                            KONFIRMASI ({selectedMK.length}) ↑
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}