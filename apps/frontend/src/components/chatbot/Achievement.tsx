// src/components/chatbot/Achievement.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trophy, Star, Zap, Flame, Save, Loader } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Sesuaikan path instalasi shadcn Anda
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import axios from "axios";
import { BACKEND_URL } from "@/constants";
import { elysiaErr } from "@/lib/elysiaErr";
import { toast } from "sonner";

const TOTAL_TAGS = 8;
const isMobile = () => window.innerWidth < 640;

interface AchievementProps {
  isDesktop: boolean;
  isOnline: boolean;
}

const Achievement: React.FC<AchievementProps> = ({ isDesktop, isOnline }) => {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((state) => state.token);
  const feedbackNumber = useAuthStore((state) => state.feedbackNumber);
  const tags = useChatStore((s) => s.tags);
  const canSave = useChatStore((s) => s.canSave);
  const dismissSave = useChatStore((s) => s.dismissSave);
  const [percentageAchieved, setPercentageAchieved] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const tooltipText = "Selesaikan achievement untuk mendapatkan hadiah 100K";
  const triggerClassName =
    "cursor-help text-black dark:text-neo-yellow hover:scale-110 active:scale-95 transition-transform p-0.5 rounded focus:outline-none";

  // update progress tags
  useEffect(() => {
    const newPercentage = Math.min(
      Math.floor((tags.length / TOTAL_TAGS) * 100),
      100
    );
    setPercentageAchieved(newPercentage);
  }, [tags]);

  const saveUpdateTag = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/achievement`,
        { user_key: user?.user_key, tags }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }); // Sesuaikan endpoint backend Anda
      console.log("response.data", response.data);
      dismissSave();
      toast.success("Unlocked Tags is saved!.");
    } catch (error) {
      elysiaErr(error);
      console.error("Gagal mengambil data statistik:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${isDesktop && `neo-box`} p-3 dark:border-neo-yellow bg-white dark:bg-zinc-900`}>
      {/* Header */}
      <div className="text-xxs font-bold uppercase tracking-widest border-b-2 border-black dark:border-neo-yellow pb-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3 h-3" />
        // Achievement
        </div>

        {/* Tooltip: Mobile (press) & Desktop (hover)  */}
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
                Selesaikan achievement untuk mendapatkan hadiah 100K
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>}

      </div>

      {/* Kritik Feedback */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xxs font-bold uppercase tracking-widest opacity-60">
            kritik
          </span>
          <span className="text-xxs font-black tabular-nums">
            {Math.min(feedbackNumber, 4)} / 4
          </span>
        </div>
        <div className="h-3 border-2 border-black dark:border-neo-yellow bg-neo-bg dark:bg-zinc-950 overflow-hidden">
          <motion.div
            className="h-full bg-neo-yellow dark:bg-neo-yellow"
            initial={{ width: 0 }}
            // Menghitung persentase: (nilai saat ini / 4) * 100
            // Math.min memastikan lebar maksimal berhenti di 100% jika feedbackNumber >= 4
            animate={{ width: `${Math.min((feedbackNumber / 4) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Unlock bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="w-full flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xxs font-bold uppercase tracking-widest opacity-60">
              Unlock Tags
            </span>
            <span className="text-xxs font-black tabular-nums">
              {tags.length} / {TOTAL_TAGS}
            </span>
          </div>
          <div className="h-3 border-2 border-black dark:border-neo-yellow bg-neo-bg dark:bg-zinc-950 overflow-hidden">
            <motion.div
              className="h-full bg-neo-yellow dark:bg-neo-yellow"
              initial={{ width: 0 }}
              animate={{ width: `${percentageAchieved}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        {user?.user_key && canSave && (
          <button
            disabled={loading}
            onClick={saveUpdateTag}
            className={`
                ${!isOnline
                ? "hidden"
                : "bg-neo-blue text-white py-2 px-2 neo-btn shadow-neo-sm"
              }`}>
            {loading ? <Loader /> :
              <Save className="w-4 h-4 stroke-[2.5]" />}
          </button>
        )}
      </div>

      {/* Tags */}
      <div
        className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-2"
        style={{
          scrollbarWidth: "auto",
          scrollbarColor: "currentColor transparent",
        }}
      >
        <AnimatePresence>
          {tags.length > 0 ? (
            tags.map((tag, idx) => {
              const isRekomendasi = tag.toLowerCase() === "rekomendasi";
              return (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, x: -12, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: 12, height: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  className={`flex items-center gap-2 px-2 py-1 border-2 border-black 
                ${isRekomendasi
                      ? "bg-neo-red text-neo-white-neutral dark:border-neo-red dark:bg-neo-red shadow-neo-yellow dark:shadow-[2px_2px_0_0_#65%_0.25_25]"
                      : "bg-neo-yellow dark:bg-zinc-800 dark:border-neo-yellow shadow-neo-yellow dark:shadow-[2px_2px_0_0_#facc15]"
                    }`}
                >
                  {/* Ikon berubah jadi Flame jika rekomendasi, warna ikon menyesuaikan */}
                  {isRekomendasi ? (
                    <Flame className="w-3 h-3 shrink-0 fill-neo-white-neutral stroke-neo-white-neutral" />
                  ) : (
                    <Star className="w-3 h-3 shrink-0 fill-black dark:fill-neo-yellow" />
                  )}

                  <span className="text-xxs font-black uppercase tracking-tight truncate">
                    {tag}
                  </span>
                </motion.div>
              )
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-1 py-3 border-2 border-dashed border-black/30 dark:border-neo-yellow/30"
            >
              <Zap className="w-4 h-4 opacity-30" />
              <p className="text-xxs uppercase tracking-widest opacity-40 text-center leading-relaxed">
                Mulai chat<br />untuk unlock
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Achievement;