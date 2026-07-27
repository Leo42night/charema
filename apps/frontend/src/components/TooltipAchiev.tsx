import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const isMobile = () => window.innerWidth < 640;

const TooltipAchiev = ({ tooltipText }: { tooltipText: string }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const triggerClassName =
        "cursor-help text-black dark:text-neo-yellow hover:scale-110 active:scale-95 transition-transform p-0.5 rounded focus:outline-none";

    // Hitung posisi tooltip relatif viewport tiap kali dibuka (mobile only)
    useEffect(() => {
        if (!open || !triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const popoverWidth = popoverRef.current?.offsetWidth ?? 180;

        let left = rect.right - popoverWidth;
        if (left < 8) left = 8;
        if (left + popoverWidth > window.innerWidth - 8) {
            left = window.innerWidth - popoverWidth - 8;
        }

        setCoords({
            top: rect.bottom + 6,
            left,
        });
    }, [open]);

    // Tutup saat klik di luar trigger & popover
    useEffect(() => {
        function handleClickOutside(e: MouseEvent | TouchEvent) {
            const target = e.target as Node;
            if (
                triggerRef.current &&
                !triggerRef.current.contains(target) &&
                popoverRef.current &&
                !popoverRef.current.contains(target)
            ) {
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

    // Tutup saat scroll supaya tidak "ngambang" di posisi lama
    useEffect(() => {
        if (!open) return;
        function handleScroll() {
            setOpen(false);
        }
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, [open]);

    return (
        <>
            {isMobile() ? (
                <>
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen((prev) => !prev);
                        }}
                        className={triggerClassName}
                        aria-label="Informasi Achievement"
                    >
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {open &&
                        createPortal(
                            <div
                                ref={popoverRef}
                                style={{ position: "fixed", top: coords.top, left: coords.left }}
                                className="z-9999 max-w-45 p-2 border-2 border-black dark:border-neo-yellow bg-black text-white font-mono font-black uppercase tracking-tight text-center rounded-none shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_oklch(89.5%_0.23_95)] flex flex-col"
                            >
                                {tooltipText}
                            </div>,
                            document.body
                        )}
                </>
            ) : (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger
                            className="cursor-help text-black dark:text-neo-yellow hover:scale-110 active:scale-95 transition-transform p-0.5 rounded focus:outline-none"
                            aria-label="Informasi Achievement"
                        >
                            <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                        </TooltipTrigger>

                        {/* Konten Tooltip Bergaya Neo-Brutalisme */}
                        <TooltipContent
                            side="top"
                            align="end"
                            className="bg-black text-white font-mono font-black uppercase tracking-tight p-2 rounded-none border-2 border-black dark:border-neo-yellow shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_oklch(89.5%_0.23_95)] animate-in fade-in-0 zoom-in-95 data-[side=top]:slide-in-from-bottom-1 max-w-45 text-center"
                        >
                            {tooltipText}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </>
    );
};

export default TooltipAchiev;