// components/chatbot/RekomendasiMsg.tsx
import { useMemo, useState } from "react";
import type { CategoryData } from "@/types";
import category from "@/data/category.json";
import { useRecomToMatkul } from "@/hooks/useRecomToMatkul";

interface RekomendasiResultProps {
    selectedMatkulIds: number[];
}

// tampilan di message berisi hasil rekomendasi matkul dan kategori
const RekomendasiMsg = ({ selectedMatkulIds }: RekomendasiResultProps) => {
    const { category_map } = category as CategoryData; // map untuk name
    const recoms = useRecomToMatkul();
    const availableMatkuls = recoms!.matkuls;
    const categories = recoms!.categories;
    const category_matkuls = recoms!.category_matkuls;
    const topCategoryKey = recoms!.topCategoryKey;

    const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);


    // hitung selected Category (ubah tiap ada seleksi baru)
    const countCatSelected = useMemo(() => {
        const countMap: Record<string, number> = {};

        // Lakukan pencarian instan O(1) langsung menggunakan key objek Record
        for (const mkid of selectedMatkulIds) {
            // Ambil data langsung menggunakan ID matkul (mkid) sebagai key
            const matkul = availableMatkuls[mkid];

            // Validasi jika data tidak ditemukan atau tidak memiliki properti category
            if (!matkul || matkul.category == null) continue;

            const catKey = String(matkul.category);
            countMap[catKey] = (countMap[catKey] ?? 0) + 1;
        }

        return countMap;
    }, [selectedMatkulIds, availableMatkuls]);


    return (
        <div className="mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">

            {/* === SCOREBOARD KATEGORI === */}
            <div className="flex flex-col gap-1">
                <div className="px-1 opacity-50 font-black text-[9px] uppercase tracking-tighter mb-1">
                    Kategori Relevan
                </div>
                {categories.map((cat, idx) => {
                    const isTop = idx === 0;
                    const maxScore = categories[0]?.totalScore ?? 1;
                    const barWidth = Math.round((cat.totalScore / maxScore) * 100);

                    return (
                        <div
                            key={cat.category}
                            className={`relative flex items-center gap-2 px-2 py-1.5 border-2 overflow-hidden
                            ${isTop
                                    ? 'border-black dark:border-neo-yellow bg-neo-yellow text-black shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#facc15]'
                                    : 'border-black dark:border-zinc-700 bg-white dark:bg-zinc-900'
                                }`}
                        >
                            {/* progress bar background */}
                            {!isTop && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-zinc-100 dark:bg-zinc-800"
                                    style={{ width: `${barWidth}%` }}
                                />
                            )}

                            {/* rank badge */}
                            <span className={`relative z-10 text-[9px] font-black w-4 shrink-0 opacity-60 ${isTop ? 'text-black' : ''}`}>
                                #{idx + 1}
                            </span>

                            {/* name */}
                            <span className={`relative z-10 flex-1 text-[10px] font-black truncate ${isTop ? 'text-black' : ''}`}>
                                Kategori {category_map[cat.category]}
                            </span>

                            {/* count */}
                            <span className={`relative z-10 text-[8px] font-bold opacity-60 shrink-0 ${isTop ? 'text-black' : ''}`}>
                                {cat.count} matkul
                            </span>

                            {/* count selected */}
                            <span className={`relative z-10 text-[8px] font-bold opacity-60 shrink-0 ${isTop ? 'text-black' : ''}`}>
                                ({countCatSelected[cat.category]} dipilih)
                            </span>

                            {/* total score */}
                            <div className={`relative z-10 flex flex-col items-end shrink-0 min-w-10.5 px-1.5 py-0.5
                            ${isTop
                                    ? 'bg-black text-neo-yellow'
                                    : 'bg-neo-yellow text-black border-l border-black dark:border-neo-yellow'
                                }`}>
                                <span className="text-[6px] font-black uppercase leading-none">Score</span>
                                <span className="text-[10px] font-black leading-tight">
                                    {cat.totalScore.toFixed(3)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* === KURIKULUM KATEGORI TERATAS === */}
            {category_matkuls && category_matkuls.length > 0 && (
                <div className="flex flex-col gap-1">
                    <div className="px-1 opacity-50 font-black text-[9px] uppercase tracking-tighter mb-1">
                        Kurikulum — {category_map[categories[0].category] ?? `Kategori ${topCategoryKey}`}
                    </div>
                    <div className="flex flex-col gap-1">
                        {category_matkuls.map((cm, idx) => (
                            <div
                                key={cm.kode ?? idx}
                                className="flex items-center gap-2 px-2 py-1.5 border border-black dark:border-zinc-700 bg-white dark:bg-zinc-900"
                            >
                                {/* semester badge */}
                                <span className="text-[8px] font-black opacity-40 shrink-0 w-6 text-right">
                                    Smt {cm.semester}
                                </span>

                                {/* kode */}
                                <span className="text-[8px] font-black border border-black dark:border-zinc-600 px-1 shrink-0 opacity-70">
                                    {cm.kode}
                                </span>

                                {/* nama */}
                                <span className="text-[10px] font-semibold flex-1 truncate">{cm.matkul}</span>

                                {/* sks */}
                                <span className="text-[8px] opacity-50 shrink-0">{cm.sks} SKS</span>

                                {/* wajib badge */}
                                {cm.wajib === 1 && (
                                    <span className="text-[7px] font-black px-1 bg-neo-yellow text-black border border-black shrink-0">
                                        Wajib
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === MATA KULIAH TERPILIH === */}
            <div className="flex justify-between items-end px-1 opacity-50 font-black text-[9px] uppercase tracking-tighter">
                <span>Mata Kuliah Terpilih</span>
                <span>Rank / Score</span>
            </div>
            {
                selectedMatkulIds.map((mkid, idx) => {
                    const mk = availableMatkuls[mkid];
                    const dosenList = mk.dosen?.split('\n').map(d => d.trim()).filter(Boolean) ?? [];
                    const dosenPreview = dosenList[0] ?? '-';
                    const hasMultipleDosen = dosenList.length > 1;

                    // CEK APAKAH BARIS INI YANG SEDANG AKTIF TOOLTIPNYA
                    const isTooltipOpen = activeTooltipId === mk.item;

                    return (
                        <div
                            key={idx}
                            className="flex flex-col p-3 border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#facc15] gap-2"
                        >
                            {/* Row 1: nama + score/rank */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="text-[11px] font-black leading-tight">{mk.matkul}</div>
                                    <div className="flex flex-wrap gap-2 text-[9px] opacity-70 items-center">
                                        {mk.kode && (
                                            <span className="px-1 py-px border border-black dark:border-current font-bold">
                                                {mk.kode}
                                            </span>
                                        )}
                                        {/* handle boolean: 0 juga nilai ( 0 = Pilihan, 1 = Wajib) */}
                                        {mk.wajib != null && (
                                            <span className={`px-1 py-px font-bold border ${mk.wajib ? 'border-black dark:border-neo-yellow bg-neo-yellow text-black' : 'border-current opacity-60'}`}>
                                                {mk.wajib ? 'Wajib' : 'Pilihan'}
                                            </span>
                                        )}
                                        {mk.semester && (
                                            <span className={`px-1.5 py-px border border-black dark:border-white font-black text-[9px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] text-white
                                                ${mk.semester % 2 !== 0
                                                    ? "bg-neo-blue"   // Gaya GANJIL (Biru Elektrik)
                                                    : "bg-neo-purple" // Gaya GENAP (Ungu Brutalist)
                                                }`}
                                            >
                                                Smt {mk.semester}
                                            </span>
                                        )}
                                        {mk.sks && <span>{mk.sks} SKS</span>}
                                        <span>{category_map[mk.category]}</span>
                                        <span className="italic text-neutral-500 dark:text-neutral-400 font-normal">
                                            Update {2000 + mk.tahun} {mk.sm === 1 ? "Feb" : "Aug"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex flex-col items-end text-right">
                                        <span className="text-[8px] font-black uppercase opacity-50">Rank</span>
                                        <span className="text-md font-black italic">#{mk.rank ?? '-'}</span>
                                    </div>
                                    <div className="flex flex-col items-end min-w-10 py-1 px-2 bg-neo-yellow text-black border-l-2 border-black shadow-[-2px_0_0_0_#000]">
                                        <span className="text-[7px] font-black uppercase">Score</span>
                                        <span className="text-[11px] font-black">
                                            {mk.score ? (mk.score * 100).toFixed(2) + '%' : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: dosen (with tooltip popup) */}
                            <div
                                className="relative inline-flex max-w-full items-center gap-1 min-w-0"
                                onMouseEnter={() => setActiveTooltipId(mk.item)} // Desktop hover masuk
                                onMouseLeave={() => setActiveTooltipId(null)}   // Desktop hover keluar
                            >
                                <span className="text-[8px] font-black uppercase opacity-40 shrink-0">Dosen</span>
                                <span className="text-[9px] font-semibold truncate opacity-80">{dosenPreview}</span>
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
                                            className={`absolute bottom-full mb-1.5 left-0 h-min z-50 flex-col gap-1 max-w-75 p-2 border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 text-foreground shadow-neo-sm neo-box
                                                            ${isTooltipOpen ? 'flex' : 'hidden'}`}
                                        >
                                            {dosenList.map((d, i) => (
                                                <span key={i} className="text-[9px] font-semibold leading-tight text-nowrap">
                                                    {i + 1}. {d}
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Row 3: prasyarat (opsional) */}
                            {mk.prasyarat && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-black uppercase opacity-40 shrink-0">Prasyarat</span>
                                    <span className="text-[9px] opacity-70 truncate">{mk.prasyarat}</span>
                                </div>
                            )}
                        </div>
                    );
                })
            }
        </div>
    )
}

export default RekomendasiMsg