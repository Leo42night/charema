import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

const isMobile = () => window.innerWidth < 640;

const TooltipAchiev = () => {
    const [open, setOpen] = useState(false);
    const tooltipText = "Hadiah Rp100k! lihat misi di Video Tutorial";
    const triggerClassName =
        "cursor-help text-black dark:text-neo-yellow hover:scale-110 active:scale-95 transition-transform p-0.5 rounded focus:outline-none";


    return (
        <>
            {isMobile() ?
                <div className="relative">
                    <button
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

                    <div
                        className={`absolute right-0 top-full mt-1.5 z-50 p-2 border-2 border-black dark:border-neo-yellow bg-black text-white font-mono font-black uppercase tracking-tight text-center rounded-none shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_oklch(89.5%_0.23_95)]
                    ${open ? "flex flex-col" : "hidden"}`}
                    >
                        {tooltipText}
                    </div>
                </div> :
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
                </TooltipProvider>}
        </>
    )
}

export default TooltipAchiev