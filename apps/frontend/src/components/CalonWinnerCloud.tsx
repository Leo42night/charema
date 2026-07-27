import { useState, useEffect, useRef, useMemo } from "react";
import TooltipAchiev from "./TooltipAchiev";
import { useAuthStore } from "@/stores/useAuthStore";

interface CalonWinnersCloudProps {
    calon_winners: string[];
    my_tags_lenght: number;
}

// 3 kolom x 8 baris = 24 slot maksimal. Kolom lebih lebar supaya 12 karakter NIM muat penuh tanpa truncate.
const COLS = 3;
const ROWS = 8;
const MAX_SLOT_COUNT = COLS * ROWS;

const SIZE_CLASSES = ["text-[9px]", "text-[10px]", "text-[11px]"];
const COLOR_CLASSES = [
    "text-black dark:text-neo-yellow",
    "text-neutral-600 dark:text-neutral-300",
    "text-yellow-600 dark:text-yellow-400",
    "text-neutral-500 dark:text-neutral-500",
];

interface Slot {
    id: number;
    value: string;
    size: string;
    color: string;
    updateCount: number;
}

export function CalonWinnersCloud({ calon_winners, my_tags_lenght
}: CalonWinnersCloudProps) {
    const feedbackNumber = useAuthStore((state) => state.feedbackNumber);
    const rating = useAuthStore((state) => state.rating);
    const tagsAchieved = my_tags_lenght >= 15;
    const kritikAchieved = feedbackNumber >= 4;
    const ratingAchieved = rating !== null;

    const shuffledPool = useMemo(() => {
        return [...calon_winners].sort(() => Math.random() - 0.5);
    }, [calon_winners]);

    // Jumlah slot yang benar-benar dipakai: mengikuti jumlah data, dibatasi maksimal MAX_SLOT_COUNT
    const slotCount = Math.min(MAX_SLOT_COUNT, Math.max(shuffledPool.length, 1));
    // Grid baru dianggap "penuh" (butuh tinggi tetap) kalau data sudah mencapai kapasitas maksimal
    const isFull = shuffledPool.length >= MAX_SLOT_COUNT;

    const [slots, setSlots] = useState<Slot[]>(() =>
        Array.from({ length: slotCount }, (_, i) => ({
            id: i,
            value: shuffledPool[i % shuffledPool.length] ?? "",
            size: pickRandom(SIZE_CLASSES),
            color: pickRandom(COLOR_CLASSES),
            updateCount: 0,
        }))
    );

    // Rebuild slots kalau jumlah data (dan karenanya slotCount) berubah
    useEffect(() => {
        setSlots(
            Array.from({ length: slotCount }, (_, i) => ({
                id: i,
                value: shuffledPool[i % shuffledPool.length] ?? "",
                size: pickRandom(SIZE_CLASSES),
                color: pickRandom(COLOR_CLASSES),
                updateCount: 0,
            }))
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slotCount, shuffledPool]);

    const poolIndexRef = useRef(slotCount % Math.max(shuffledPool.length, 1));

    useEffect(() => {
        // Rotasi hanya jalan kalau data lebih banyak dari slot yang tampil
        if (shuffledPool.length <= slotCount) return;

        const interval = setInterval(() => {
            setSlots((prev) => {
                const slotsToUpdate = Math.min(
                    slotCount,
                    Math.floor(Math.random() * 4) + 3
                );
                const indices = new Set<number>();
                while (indices.size < slotsToUpdate) {
                    indices.add(Math.floor(Math.random() * slotCount));
                }

                return prev.map((slot, i) => {
                    if (!indices.has(i)) return slot;

                    const nextValue = shuffledPool[poolIndexRef.current % shuffledPool.length];
                    poolIndexRef.current += 1;

                    return {
                        ...slot,
                        value: nextValue,
                        size: pickRandom(SIZE_CLASSES),
                        color: pickRandom(COLOR_CLASSES),
                        updateCount: slot.updateCount + 1,
                    };
                });
            });
        }, 350);

        return () => clearInterval(interval);
    }, [shuffledPool, slotCount]);

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-center gap-1.5">
                <span className="text-xxs font-black uppercase bg-black text-white dark:bg-neo-yellow dark:text-black px-1.5 py-0.5 border border-black shrink-0">
                    Undian 2nd Winner
                </span>
                <TooltipAchiev tooltipText="Hasil undian tunggu progress rekomendasi user 70%" />
            </div>

            <div
                className={`w-62.5 mx-auto overflow-hidden relative border-2 border-black dark:border-neutral-700 bg-white dark:bg-zinc-900 flex items-center justify-center
                    ${isFull ? "h-50" : "min-h-0 py-3"}`}
            >
                {isFull ? (
                    // Data sudah penuh (>= 24) -> pakai grid tetap 3x8 dengan tinggi fixed 200px
                    <div
                        className="grid w-full h-full"
                        style={{
                            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                        }}
                    >
                        {slots.map((slot) => (
                            <div
                                key={slot.id}
                                className="flex items-center justify-center px-0.5"
                            >
                                <span
                                    key={`${slot.id}-${slot.updateCount}`}
                                    className={`font-mono font-black tracking-tight whitespace-nowrap ${slot.size} ${slot.color} neo-cloud-fade`}
                                >
                                    {slot.value}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Data belum penuh -> flex wrap, tinggi mengikuti konten, semua item di tengah
                    <div className="flex flex-wrap items-center justify-center content-center gap-x-3 gap-y-2 w-full px-2">
                        {slots.map((slot) => (
                            <span
                                key={`${slot.id}-${slot.updateCount}`}
                                className={`font-mono font-black tracking-tight whitespace-nowrap ${slot.size} ${slot.color} neo-cloud-fade`}
                            >
                                {slot.value}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Progress user menuju syarat undian */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <ChipButton
                    label={`${my_tags_lenght}/15 Tags`}
                    achieved={tagsAchieved}
                    achievedClass="bg-neo-yellow border-black text-black shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#facc15]"
                    defaultClass="bg-white dark:bg-zinc-800 border-black dark:border-neutral-600 text-black dark:text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)]"
                    popoverText={tagsAchieved ? "Target min. Tags tercapai! 🎉" : "Kejar Minimum Tags untuk 2nd Winner"}
                />
                <ChipButton
                    label={`${feedbackNumber}/4 Kritik`}
                    achieved={kritikAchieved}
                    achievedClass="bg-blue-500 border-black text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)]"
                    defaultClass="bg-white dark:bg-zinc-800 border-black dark:border-neutral-600 text-black dark:text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)]"
                    popoverText={kritikAchieved ? "Target Kritik tercapai! 🎉" : "Capai Max Kritik untuk 2nd Winner"}
                />
                <ChipButton
                    label="Rating"
                    achieved={ratingAchieved}
                    achievedClass="mt-0.5 bg-green-500 border-black text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)] flex items-center justify-center"
                    defaultClass="mt-0.5 bg-white dark:bg-zinc-800 border-black dark:border-neutral-600 text-zinc-400 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)] w-6 h-6 flex items-center justify-center"
                    popoverText={
                        ratingAchieved ? "Sudah memberi rating ⭐" : "Anda belum memberi rating"
                    }
                />
            </div>
        </div>
    );
}


function ChipButton({
    label,
    achieved,
    achievedClass,
    defaultClass,
    popoverText,
}: {
    label: string;
    achieved: boolean;
    achievedClass: string;
    defaultClass: string;
    popoverText: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: Event) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`font-space font-black text-xs px-2 py-0.5 border-2 shrink-0 active:scale-95 transition-transform ${achieved ? achievedClass : defaultClass
                    }`}
            >
                {label}
            </button>

            {open && (
                <div
                    className="absolute z-50 top-full right-0 mt-1 w-40 p-2 border-2 border-black bg-white dark:bg-zinc-900 dark:border-neo-yellow shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#facc15] text-[10px] font-bold text-black dark:text-white"
                >
                    {popoverText}
                </div>
            )}
        </div>
    );
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}