// src/stores/useChatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Message } from "@/types";
const audioAchivement = new Audio('/game-bonus.mp3');

const TOTAL_TAGS = 8;

interface FeedbackData {
  inputChat: string;      // Pesan yang dikirim user sebelumnya
  systemResponse: string; // Balasan dari system yang diberi masukan
  feedbackMessage: string; // Isi saran/masukan dari user
}

interface ChatStore {
  // ── Chat ────────────────────────────────────────────────────────────────────
  messages: Message[]; // riwayat pesan
  // Menggunakan Record<id_pesan, isi_saran> agar tiap pesan punya catatan feedback unik
  feedback: Record<number, FeedbackData>;
  setFeedback: (
    id: number,
    updater: Partial<FeedbackData> | ((prev: FeedbackData) => Partial<FeedbackData>)
  ) => void;
  setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  appendMessage: (msg: Message) => void;
  clearMessages: () => void;

  // ── Achievement ─────────────────────────────────────────────────────────────
  tags: string[];
  percentageAchieved: number;
  /** null = tidak ada toast */
  toastTag: string | null;
  /**
   * Panggil setiap kali predictedTag datang dari model.
   * Kalau tag baru → disimpan ke persist + trigger toast.
   */
  unlockTag: (tag: string) => void;
  dismissToast: () => void;
  clearAchievements: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // ── Chat ────────────────────────────────────────────────────────────────
      messages: [],

      setMessages: (updater) =>
        set((state) => ({
          messages:
            typeof updater === "function"
              ? updater(state.messages)
              : updater,
        })),

      appendMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

      clearMessages: () => set({ messages: [] }),

      // ── Achievement ──────────────────────────────────────────────────────────
      feedback: {}, // Initial state berupa objek kosong
      setFeedback: (id, updater) =>
        set((state) => {
          // Sediakan cetakan nilai default jika ID belum ada di store
          const defaultVal: FeedbackData = { inputChat: "", systemResponse: "", feedbackMessage: "" };
          const currentVal = state.feedback[id] || defaultVal;

          // Jalankan updater berdasarkan tipe argumen (fungsi callback atau objek parsial)
          const partialNewVal = typeof updater === "function" ? updater(currentVal) : updater;

          return {
            feedback: {
              ...state.feedback,
              [id]: {
                ...currentVal,
                ...partialNewVal, // Menggabungkan data lama dengan data baru
              },
            },
          };
        }),

      tags: [],
      percentageAchieved: 0,
      toastTag: null,

      unlockTag: (tag) => {
        const { tags } = get();
        if (tags.includes(tag)) return; // sudah unlock, skip
        audioAchivement.play();

        const next = [...tags, tag];
        set({
          tags: next,
          percentageAchieved: Math.min(
            Math.floor((next.length / TOTAL_TAGS) * 100),
            100
          ),
          toastTag: tag,
        });
      },

      dismissToast: () => set({ toastTag: null }),

      clearAchievements: () =>
        set({ tags: [], percentageAchieved: 0, toastTag: null }),
    }),
    {
      name: "chat-store",
      // Simpan ke localStorage hanya data persisten — bukan toastTag (ephemeral)
      partialize: (state) => ({
        messages: state.messages,
        tags: state.tags,
        percentageAchieved: state.percentageAchieved,
      }),
    }
  )
);