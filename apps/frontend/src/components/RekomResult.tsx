// components/chatbot/RekomResult.tsx
import { useMemo, useState } from "react";
import type { CategoryData, MataKuliah, RecommendationResult } from "@/types";
import category from "@/data/category.json";
import { MatkulCard } from "./MatkulCard";

interface RekomResultProps {
    recoms: RecommendationResult;
    /**
     * Mode "selected" → hanya tampilkan matkul dari array ID ini (RekomendasiMsg)
     * Mode "all"      → tampilkan semua availableMatkuls, dimming yang tidak dipilih (AboutPage)
     */
    mode: "selected" | "all";
    selectedMatkulIds: number[];
    /** Header + footnote hanya tampil di mode "all" */
    showListHeader?: boolean;
}

export const RekomResult = ({
    recoms,
    mode,
    selectedMatkulIds,
    showListHeader = false,
}: RekomResultProps) => {
    const { category_map } = category as CategoryData;
    const { matkuls: availableMatkuls, categories, category_matkuls, topCategoryKey } = recoms;

    const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);

    // Hitung jumlah matkul terpilih per kategori
    const countCatSelected = useMemo(() => {
        const countMap: Record<string, number> = {};
        for (const mkid of selectedMatkulIds) {
            const matkul = availableMatkuls[mkid];
            if (!matkul || matkul.category == null) continue;
            const catKey = String(matkul.category);
            countMap[catKey] = (countMap[catKey] ?? 0) + 1;
        }
        return countMap;
    }, [selectedMatkulIds, availableMatkuls]);

    // Daftar matkul yang akan dirender
    const matkulList: MataKuliah[] = useMemo(() => {
        if (mode === "selected") {
            return selectedMatkulIds
                .map((id) => availableMatkuls[id])
                .filter(Boolean);
        }
        return Object.values(availableMatkuls);
    }, [mode, selectedMatkulIds, availableMatkuls]);

    return (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">

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
                            {!isTop && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-zinc-100 dark:bg-zinc-800"
                                    style={{ width: `${barWidth}%` }}
                                />
                            )}

                            <span className={`relative z-10 text-[9px] font-black w-4 shrink-0 opacity-60 ${isTop ? 'text-black' : ''}`}>
                                #{idx + 1}
                            </span>

                            <span className={`relative z-10 flex-1 text-[10px] font-black truncate ${isTop ? 'text-black' : ''}`}>
                                Kategori {category_map[cat.category]}
                            </span>

                            <span className={`relative z-10 text-[8px] font-bold opacity-60 shrink-0 ${isTop ? 'text-black' : ''}`}>
                                {cat.count} matkul
                            </span>

                            <span className={`relative z-10 text-[8px] font-bold opacity-60 shrink-0 ${isTop ? 'text-black' : ''}`}>
                                ({countCatSelected[cat.category] ?? 0} dipilih)
                            </span>

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
                                <span className="text-[8px] font-black opacity-40 shrink-0 w-6 text-right">
                                    Smt {cm.semester}
                                </span>
                                <span className="text-[8px] font-black border border-black dark:border-zinc-600 px-1 shrink-0 opacity-70">
                                    {cm.kode}
                                </span>
                                <span className="text-[10px] font-semibold flex-1 truncate">{cm.matkul}</span>
                                <span className="text-[8px] opacity-50 shrink-0">{cm.sks} SKS</span>
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

            {/* === HEADER DAFTAR (hanya mode all) === */}
            {showListHeader && (
                <>
                    <div className="flex justify-between items-end px-1 font-black text-[9px] uppercase tracking-tighter text-neutral-800 dark:text-neutral-200">
                        <span>Matkul yang anda pilih</span>
                        <span>
                            Rank / Score <span className="hidden md:inline">(kemungkinan lulus)</span>
                        </span>
                    </div>
                    <p className="text-[9px] font-bold opacity-60 normal-case leading-tight">
                        *Dalam daftar hasil rekomendasi Neural Collaborative Filtering
                    </p>
                </>
            )}

            {/* === DAFTAR MATA KULIAH === */}
            <div className={
                mode === "all"
                    ? "max-h-[50vh] md:max-h-[80vh] overflow-y-auto px-1 py-2 flex flex-col gap-3 border-y border-zinc-200/50 dark:border-zinc-800/50"
                    : "flex flex-col gap-3"
            }>
                {matkulList.map((mk) => (
                    <MatkulCard
                        key={mk.item}
                        mk={mk}
                        isSelected={mode === "all" ? selectedMatkulIds.includes(mk.item) : undefined}
                        activeTooltipId={activeTooltipId}
                        setActiveTooltipId={setActiveTooltipId}
                    />
                ))}
            </div>
        </div>
    );
};