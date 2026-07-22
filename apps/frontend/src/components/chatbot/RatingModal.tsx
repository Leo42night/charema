import React, { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner"; // atau react-toastify / toast bawaan Anda
import { useChatStore } from "@/stores/useChatStore";
import { BACKEND_URL } from "@/constants";
import { elysiaErr } from "@/lib/elysiaErr";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setRating = useAuthStore((state) => state.setRating);
  const rating = useAuthStore((state) => state.rating);
  const dismissSave = useChatStore((s) => s.dismissSave);

  // State untuk menyimpan skor rating (1-5)
  const [scoreCF, setScoreCF] = useState<number>(0);
  const [scoreChat, setScoreChat] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State hover untuk efek interaktif visual bintang
  const [hoverCF, setHoverCF] = useState<number>(0);
  const [hoverChat, setHoverChat] = useState<number>(0);

  useEffect(() => {
    if (rating) {
      setScoreCF(rating.score_cf);
      setScoreChat(rating.score_chat);
      setMessage(rating.message || "");
    }
  }, [isOpen, rating]);

  if (!isOpen) return null;

  const handleSubmitScore = async () => {
    if (!user?.user_key) {
      toast.error("Anda harus login terlebih dahulu!");
      return;
    }

    if (scoreCF === 0 || scoreChat === 0) {
      toast.error("Harap berikan rating untuk kedua model!");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        user_key: user.user_key,
        score_cf: scoreCF,
        score_chat: scoreChat,
        message
      };

      await axios.post(
        `${BACKEND_URL}/score`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRating({ score_cf: scoreCF, score_chat: scoreChat });

      dismissSave();

      toast.success("Terima kasih! Rating disimpan.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      elysiaErr(error);
      console.error("Gagal mengirim rating:", error);
      const errorMsg = error.response?.data?.error || "Terjadi kesalahan server";
      toast.error(`Gagal: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      {/* Container Utama Bergaya Neo-Brutalisme */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000] dark:bg-zinc-900 dark:border-neo-yellow dark:shadow-[6px_6px_0_0_oklch(89.5%_0.23_95)]">

        {/* Tombol Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 border-2 border-black p-1 bg-neo-red hover:bg-opacity-90 active:translate-x-px active:translate-y-px active:shadow-none"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Header */}
        <h2 className="text-lg font-black uppercase tracking-tight text-black dark:text-white mb-4 border-b-2 border-black dark:border-neo-yellow pb-2">
          Beri Rating Sistem
        </h2>

        <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-6">
          Evaluasi hasil rekomendasi dan performa chatbot untuk membantu riset kami.
        </p>

        {/* Seksi 1: Neural Collaborative Filtering */}
        <div className="mb-6">
          <label className="block text-[11px] font-black uppercase tracking-wider text-black dark:text-neo-yellow mb-2">
            1. Rekomendasi Matkul <span className="hidden sm:inline">(Neural Collaborative Filtering)</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={`cf-${star}`}
                type="button"
                onClick={() => setScoreCF(star)}
                onMouseEnter={() => setHoverCF(star)}
                onMouseLeave={() => setHoverCF(0)}
                className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 stroke-[2.5] ${star <= (hoverCF || scoreCF)
                    ? "fill-neo-yellow text-black dark:text-neo-yellow"
                    : "text-gray-300 dark:text-zinc-700"
                    }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Seksi 2: Feed-Forward Neural Network */}
        <div className="mb-6">
          <label className="block text-[11px] font-black uppercase tracking-wider text-black dark:text-neo-yellow mb-2">
            2. Chatbot <span className="hidden sm:inline">(Feed-Forward Neural Network)</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={`chat-${star}`}
                type="button"
                onClick={() => setScoreChat(star)}
                onMouseEnter={() => setHoverChat(star)}
                onMouseLeave={() => setHoverChat(0)}
                className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 stroke-[2.5] ${star <= (hoverChat || scoreChat)
                    ? "fill-neo-yellow text-black dark:text-neo-yellow"
                    : "text-gray-300 dark:text-zinc-700"
                    }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* text pesan (opsional) */}
        <div className="mb-6">
          <label className="block text-[11px] font-black uppercase tracking-wider text-black dark:text-neo-yellow mb-2">
            Pesan Tambahan <span className="opacity-50 normal-case font-bold">(opsional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis masukan, kritik, atau saran kamu di sini..."
            rows={3}
            maxLength={500}
            className="w-full resize-none border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 px-3 py-2 text-[12px] text-black dark:text-neo-yellow placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#facc15] focus:outline-none focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none transition-all"
          />
          <div className="mt-1 text-right text-xxs font-bold text-zinc-400 dark:text-zinc-600">
            {message.length}/500
          </div>
        </div>

        {/* Tombol Submit */}
        <button
          onClick={handleSubmitScore}
          disabled={isSubmitting}
          className={`w-full font-mono text-xs font-black uppercase tracking-wider py-3 border-2 border-black transition-all
            ${isSubmitting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
              : "bg-neo-green text-black shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_oklch(89.5%_0.23_95)] hover:bg-opacity-90 active:shadow-none active:translate-x-1 active:translate-y-1"
            }`}
        >
          {isSubmitting ? "MENGIRIM..." : "KIRIM_RATING"}
        </button>
      </div>
    </div>
  );
};
