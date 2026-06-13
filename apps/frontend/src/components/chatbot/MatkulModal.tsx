// !!! disable batasi max 24sks selected
// !!! 15 matkul, max 10. below set 66% (round down)
import React, { useState, useRef, useEffect, useMemo } from "react";
import type { CategoryData, ItemMatkul, MataKuliah } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import item_matkul from "@/data/item_matkul.json";
import { recommendationsToMatkul } from "@/lib/recommendationsToMatkul";
import category from "@/data/category.json";
import { toast } from "sonner";

function filterMatkul(availableMatkul: Record<string, MataKuliah>, keyword: string): MataKuliah[] {
    const kw = keyword.toLowerCase().trim();

    // Ubah Record menjadi Array of Object agar bisa difilter
    return Object.values(availableMatkul).filter(
        (mk) =>
            mk.matkul.toLowerCase().includes(kw) ||
            mk.kode?.toLowerCase().includes(kw) ||
            mk.dosen?.toLowerCase().includes(kw)
    );
}
// ── Component ──────────────────────────────────────────────────────────────────
export default function MatkulModal({
    selectedMKIds,
    setSelectedMKIds,
    onConfirm,
    onClose,
}: {
    selectedMKIds: number[];
    setSelectedMKIds: React.Dispatch<React.SetStateAction<number[]>>;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const { category_map } = category as CategoryData; // map untuk name

    const itemMatkul = item_matkul as ItemMatkul;
    const recoms = recommendationsToMatkul();
    const availableMatkuls = recoms.matkuls;

    const user = useAuthStore((s) => s.user);
    const prodi = user!.email.match(/^([a-zA-Z0-9]+)@/)![1].toUpperCase().slice(0, 3);

    const selectedMK = selectedMKIds.map((id) => {
        const found = id in itemMatkul['same']
            ? itemMatkul['same'][id]
            : itemMatkul[prodi][id]
        return {
            ...found,
            item: id
        }
    });

    const [keyword, setKeyword] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);
    // Menghitung 66% dari total, dibulatkan ke bawah (round down)
    const totalMatkul = Object.keys(availableMatkuls).length;
    const calculatedLimit = Math.floor(totalMatkul * 0.66);
    // Memastikan batas maksimal tidak melebihi 10 (max 10)
    const limitSelect = Math.min(calculatedLimit, 10);
    const totalSKS = selectedMK.reduce((a, m) => a + (m.sks || 0), 0);
    const [loading, setLoading] = useState(false);
    const [isEst, setIsEst] = useState(false); // estimasi

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        // Jika tidak ada matkul yang dipilih, reset status estimasi ke false (opsional)
        if (selectedMKIds.length === 0) {
            setIsEst(false);
            return;
        }

        let hasNullSks = false;

        // 1. UBAH DI SINI: Gunakan 'for...of' untuk mengambil isi ID asli di dalam array
        for (const mkid of selectedMKIds) {
            const matkul = availableMatkuls[String(mkid)];

            // 2. Tambahkan pengecekan aman: jika data matkul ada dan sks bernilai null/undefined/0
            if (matkul && matkul.sks == null) {
                hasNullSks = true;
                break; // Stop perulangan lebih awal jika sudah menemukan satu yang null (lebih efisien)
            }
        }

        // Set state berdasarkan hasil pemeriksaan di atas
        setIsEst(hasNullSks);

    }, [selectedMKIds, availableMatkuls]); // Tambahkan availableMatkuls ke dependency array agar selalu sinkron


    // Filter lokal — tidak perlu async karena data sudah di-memo
    const results = useMemo((): MataKuliah[] => {
        // Jika keyword kosong, langsung ubah semua isi Record menjadi Array utuh
        if (!keyword.trim()) {
            return Object.values(availableMatkuls);
        }

        // Jika ada keyword, jalankan fungsi filter yang mengembalikan Array hasil pencarian
        return filterMatkul(availableMatkuls, keyword);
    }, [keyword, availableMatkuls]);

    const handleSearch = () => {
        // Trigger re-render dengan loading flash sekedar UX feedback
        setLoading(true);
        setTimeout(() => setLoading(false), 120);
    };

    const onToggle = (mk: MataKuliah) => {
        if (!selectedMKIds.includes(mk.item) && (totalSKS + (mk?.sks ?? 0) > 24)) {
            toast.warning("Maksimal 24 SKS");
            return;
        };
        setSelectedMKIds((prev) =>
            // Gunakan .includes karena isi array 'prev' sekarang langsung angka ID
            prev.includes(mk.item)
                ? prev.filter((id) => id !== mk.item) // Hapus ID jika sudah ada
                : [...prev, mk.item]                  // Tambah ID baru jika belum ada
        );
    };

    const onRemove = (item: number) => {
        // Perbaikan: Bandingkan langsung id dengan item (tanpa .item)
        setSelectedMKIds((prev) => prev.filter((id) => id !== item));
    };

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
                        {totalMatkul > 0 && (
                            <span className="text-[9px] opacity-50 mt-0.5">
                                {totalMatkul} MK direkomendasikan
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
                    {totalMatkul === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            Belum ada rekomendasi tersedia
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            Tidak ditemukan
                        </div>
                    ) : (
                        results.map((mk, index) => {
                            const isSel = selectedMK.some(
                                (s) => s.matkul === mk.matkul && s.item === mk.item
                            );
                            const dosenList = mk.dosen?.split('\n').map(d => d.trim()).filter(Boolean) ?? [];
                            const dosenPreview = dosenList[0] ?? '-';
                            const hasMultipleDosen = dosenList.length > 1;

                            // CEK APAKAH BARIS INI YANG SEDANG AKTIF TOOLTIPNYA
                            const isTooltipOpen = activeTooltipId === mk.item;
                            // Jika indeks 0 (elemen 1), arahkan ke bawah. Sisanya ke atas.
                            const tooltipPositionClass = index < 1
                                ? "top-full mt-1.5"    // Elemen ke-1 & ke-2 (Ke bawah)
                                : "bottom-full mb-1.5"; // Elemen ke-3 dan seterusnya (Ke atas)

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
                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                        <div className="text-[11px] font-black leading-tight">
                                            {mk.matkul}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-2 text-[9px]">
                                            {mk.kode && (
                                                <span className="opacity-70 px-1 py-px border border-black dark:border-current">
                                                    {mk.kode}
                                                </span>
                                            )}
                                            {mk.wajib != null && (
                                                <span className={`px-1 py-px font-bold border ${mk.wajib ? 'border-black dark:border-neo-yellow bg-neo-yellow text-black' : 'border-current opacity-60'}`}>
                                                    {mk.wajib ? 'Wajib' : 'Pilihan'}
                                                </span>
                                            )}
                                            {mk.sks != null && <span className="font-extrabold">{mk.sks} SKS</span>}
                                            {mk.semester != null && <span className="opacity-70">Smt {mk.semester}</span>}

                                            {/* CONTAINER TOOLTIP */}
                                            <div
                                                className="relative inline-flex items-center gap-1 min-w-0"
                                                onMouseEnter={() => setActiveTooltipId(mk.item)} // Desktop hover masuk
                                                onMouseLeave={() => setActiveTooltipId(null)}   // Desktop hover keluar
                                            >
                                                <span className="text-[9px] font-semibold truncate max-w-35">{dosenPreview}</span>
                                                {hasMultipleDosen && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // PENTING: Mencegah onToggle(mk) terpicu!
                                                                setActiveTooltipId(isTooltipOpen ? null : mk.item); // Toggle khusus baris ini
                                                            }}
                                                            className="px-1.5 py-0.5 text-[8px] font-black shrink-0 cursor-pointer border-2 border-black bg-neo-yellow text-black shadow-neo-sm select-none"
                                                        >
                                                            +{dosenList.length - 1}
                                                        </button>

                                                        {/* TOOLTIP */}
                                                        <div
                                                            className={`absolute ${tooltipPositionClass} md:right-0 mb-1.5 h-min z-50 flex-col gap-1 max-w-60 p-2 border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 text-foreground shadow-neo-sm neo-box
                                                            ${isTooltipOpen ? 'flex' : 'hidden'}`}
                                                        >
                                                            {dosenList.map((d, i) => (
                                                                <span key={i} className="text-[9px] font-semibold truncate leading-tight text-nowrap">
                                                                    {i + 1}. {d}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Baris ke-2 */}
                                        <div className="flex flex-wrap items-center gap-2 text-[9px]">
                                            <span className="font-bold">{category_map[mk.category]}</span>
                                            <span className="italic text-neutral-500 dark:text-neutral-400 font-normal">
                                                Update {2000 + mk.tahun} {mk.sm === 1 ? "Feb" : "Aug"}
                                            </span>
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
                                {/* Kelompok Kiri: Teks Jumlah & Tombol Reset */}
                                <div className="flex items-center gap-2">
                                    <span>{selectedMK.length} MK dipilih</span>

                                    {/* Tombol Reset Tampil Hanya Jika Ada Matkul yang Dipilih */}
                                    {selectedMK.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMKIds([]);
                                            }}
                                            className="px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase border border-black bg-neo-red text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:scale-95 cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <span>Total: {isEst && '~'} {totalSKS} SKS</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {selectedMK.map((mk, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-1 bg-neo-yellow text-black border-2 border-black px-1.5 py-0.5 text-[9px] font-mono font-black"
                                    >
                                        <span>{mk.kode ? `${mk.kode} — ` : ""}{mk.matkul}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemove(mk.item); }}
                                            className="font-black hover:scale-330 active:scale-95 cursor-pointer text-red-700 hover:text-red-900 leading-none ml-1"
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
                            disabled={totalSKS < 22 && (!selectedMK.length || selectedMK.length < limitSelect)}
                            className="neo-btn flex-1 py-2.5 bg-black text-neo-yellow text-[10px] shadow-neo-sm disabled:opacity-40 disabled:cursor-not-allowed dark:bg-neo-yellow dark:text-black dark:border-neo-yellow"
                        >
                            KONFIRMASI ({selectedMK.length}/{limitSelect}) ↑
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}