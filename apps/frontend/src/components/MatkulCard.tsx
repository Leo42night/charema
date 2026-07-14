// components/chatbot/MatkulCard.tsx
import type { CategoryData, MataKuliah } from "@/types";
import category from "@/data/category.json";

interface MatkulCardProps {
    mk: MataKuliah;
    /** Jika undefined → selalu tampil penuh (mode RekomendasiMsg) */
    isSelected?: boolean;
    activeTooltipId: number | null;
    setActiveTooltipId: (id: number | null) => void;
}

export const MatkulCard = ({ mk, isSelected, activeTooltipId, setActiveTooltipId }: MatkulCardProps) => {
    const { category_map } = category as CategoryData;
    const alwaysFull = isSelected === undefined;
    const selected = alwaysFull || isSelected;

    const dosenList = mk.dosen?.split('\n').map(d => d.trim()).filter(Boolean) ?? [];
    const dosenPreview = dosenList[0] ?? '-';
    const hasMultipleDosen = dosenList.length > 1;
    const isTooltipOpen = activeTooltipId === mk.item;

    return (
        <div
            className={`flex flex-col p-3 border-2 gap-2 transition-all duration-200
                ${selected
                    ? "border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#facc15]"
                    : "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)] opacity-75 hover:opacity-100"
                }`}
        >
            {/* Row 1: nama + score/rank */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className={`text-[11px] font-black leading-tight ${!selected && "text-zinc-500 dark:text-zinc-400"}`}>
                        {mk.matkul}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xxs opacity-70 items-center">
                        {mk.kode && (
                            <span className={`px-1 py-px border font-bold ${selected ? "border-black dark:border-current" : "border-zinc-400 text-zinc-500"}`}>
                                {mk.kode}
                            </span>
                        )}
                        {/* handle boolean: 0 = Pilihan, 1 = Wajib */}
                        {mk.wajib != null && (
                            <span className={`px-1 py-px font-bold border ${mk.wajib ? 'border-black dark:border-neo-yellow bg-neo-yellow text-black' : 'border-current opacity-60'}`}>
                                {mk.wajib ? 'Wajib' : 'Pilihan'}
                            </span>
                        )}
                        {mk.semester && (
                            <span className={`px-1.5 py-px border border-black dark:border-white font-black text-xxs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] text-white
                                ${mk.semester % 2 !== 0
                                    ? "bg-neo-blue"
                                    : "bg-neo-purple"
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
                        <span className={`text-md font-black italic ${!selected && "text-zinc-400"}`}>
                            #{mk.rank ?? '-'}
                        </span>
                    </div>
                    <div className={`flex flex-col items-end min-w-10 py-1 px-2 border-l-2
                        ${selected
                            ? "bg-neo-yellow text-black border-black shadow-[-2px_0_0_0_#000]"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-400 dark:border-zinc-600"
                        }`}
                    >
                        <span className="text-[7px] font-black uppercase">Score</span>
                        <span className="text-[11px] font-black">
                            {mk.score ? (mk.score * 100).toFixed(2) + '%' : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Row 2: dosen (with tooltip) */}
            <div
                className="relative inline-flex max-w-full items-center gap-1 min-w-0"
                onMouseEnter={() => setActiveTooltipId(mk.item)}
                onMouseLeave={() => setActiveTooltipId(null)}
            >
                <span className="text-[8px] font-black uppercase opacity-40 shrink-0">Dosen</span>
                <span className="text-xxs font-semibold truncate opacity-80">{dosenPreview}</span>
                {hasMultipleDosen && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveTooltipId(isTooltipOpen ? null : mk.item);
                            }}
                            className="px-1.5 py-0.5 text-[8px] font-black shrink-0 cursor-pointer border-2 border-black bg-neo-yellow text-black shadow-neo-sm select-none"
                        >
                            +{dosenList.length - 1}
                        </button>

                        <div
                            className={`absolute bottom-full mb-1.5 left-0 h-min z-50 flex-col gap-1 max-w-75 p-2 border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 text-foreground shadow-neo-sm neo-box
                                ${isTooltipOpen ? 'flex' : 'hidden'}`}
                        >
                            {dosenList.map((d, i) => (
                                <span key={i} className="text-xxs font-semibold leading-tight text-nowrap">
                                    {i + 1}. {d}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Row 3: prasyarat */}
            {mk.prasyarat && (
                <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black uppercase opacity-40 shrink-0">Prasyarat</span>
                    <span className="text-xxs opacity-70 truncate">{mk.prasyarat}</span>
                </div>
            )}
        </div>
    );
};