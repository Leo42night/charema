import React from "react";
import { Award, Scroll, Crown } from "lucide-react";
import { motion } from "framer-motion";

// Mendefinisikan struktur data untuk Props
interface AchievementProps {
  percentageAchived: number;
  tags: string[];
}

// const audioAchivement = new Audio('/sounds/game-bonus.mp3');

const Achievement: React.FC<AchievementProps> = ({ percentageAchived, tags }) => {
  return (
    <div className="p-2 sm:p-4">
      <div className="flex items-center justify-center gap-2 mb-1">
        <Award className="w-5 h-5 text-amber-300" />
        <span className="text-amber-100 text-xs text-left font-semibold">
          Dialog Achievements
        </span>
      </div>

      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="flex-1 bg-black/40 outline-1 outline-amber-400/30 rounded-full h-2">
          <motion.div
            className="bg-linear-to-r from-amber-400 to-amber-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentageAchived}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-amber-300 text-sm font-medium">
          {percentageAchived}%
        </span>
      </div>

      <div className="flex justify-center flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag, idx) => (
            <motion.div
              key={idx}
              className="flex items-center gap-2 px-2 py-1.5 bg-black/30 backdrop-blur-sm border border-amber-400/30 rounded-lg w-auto"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-5 h-5 bg-linear-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-amber-900" />
              </div>
              <span className="text-amber-200 text-xs font-medium whitespace-nowrap">
                {tag}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-6">
            <Scroll className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400/50 mx-auto mb-2" />
            <p className="text-amber-200/50 text-xs sm:text-sm">
              Mulai percakapan untuk mendapatkan achievement
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievement;