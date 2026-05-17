// src/components/chatbot/AchievementToast.tsx
// Usage: <AchievementToast tag="Pertama Kali Chat" onDismiss={() => setToastTag(null)} />
// Trigger it when a new tag is unlocked, then auto-dismiss after 3s.

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";

interface AchievementToastProps {
  tag: string | null;          // null = hidden
  onDismiss: () => void;
  duration?: number;           // ms, default 3000
}

const AchievementToast: React.FC<AchievementToastProps> = ({
  tag,
  onDismiss,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!tag) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [tag, duration, onDismiss]);

  return (
    <AnimatePresence>
      {tag && (
        <motion.div
          key={tag}
          initial={{ y: -60, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 pointer-events-auto"
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5
                       border-2 border-black dark:border-neo-yellow
                       bg-neo-yellow dark:bg-zinc-900
                       shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#facc15]
                       min-w-55 max-w-[320px]"
          >
            {/* Icon block */}
            <div className="shrink-0 w-8 h-8 border-2 border-black dark:border-neo-yellow
                            bg-black dark:bg-neo-yellow flex items-center justify-center">
              <Star className="w-4 h-4 text-neo-yellow dark:text-black fill-neo-yellow dark:fill-black" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-[0.15em] opacity-60 mb-0.5">
                Achievement Unlocked!
              </div>
              <div className="text-[11px] font-black uppercase tracking-tight truncate">
                {tag}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onDismiss}
              className="shrink-0 w-6 h-6 border-2 border-black dark:border-neo-yellow
                         flex items-center justify-center
                         hover:bg-black hover:text-neo-yellow
                         dark:hover:bg-neo-yellow dark:hover:text-black
                         transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Shimmer stripe */}
          <motion.div
            className="h-1 bg-black dark:bg-neo-yellow"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            style={{ transformOrigin: "left" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementToast;