// src/stores/useChatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Message } from "@/types";
const audioAchivement = new Audio('/game-bonus.mp3');

interface FeedbackData {
  inputChat: string;      // Pesan yang dikirim user sebelumnya
  systemResponse: string; // Balasan dari system yang diberi masukan
  feedbackMessage: string; // Isi saran/masukan dari user
}

interface ChatStore {
  messages: Message[]; // riwayat pesan
  // Menggunakan Record<id_pesan, isi_saran> agar tiap pesan punya catatan feedback unik
  feedback: Record<number, FeedbackData>;
  tags: string[];
  /** null = tidak ada toast */
  toastTag: string | null;
  canSave: boolean;

  // ── Chat ────────────────────────────────────────────────────────────────────
  setFeedback: (
    id: number,
    updater: Partial<FeedbackData> | ((prev: FeedbackData) => Partial<FeedbackData>)
  ) => void;
  setMessages: (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  appendMessage: (msg: Message) => void;

  // ── Achievement ─────────────────────────────────────────────────────────────
  /**
     * Panggil setiap kali predictedTag datang dari model.
     * Kalau tag baru → disimpan ke persist + trigger toast.
     */
  unlockTag: (tag: string) => void;
  setTags: (newTags: string[]) => void;
  dismissSave: () => void;
  dismissToast: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      tags: [],
      toastTag: null,
      canSave: false,

      // ── Chat ────────────────────────────────────────────────────────────────
      setMessages: (updater) =>
        set((state) => ({
          messages:
            typeof updater === "function"
              ? updater(state.messages)
              : updater,
        })),

      appendMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),


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



      unlockTag: (tag) => {
        const { tags } = get();
        if (tags.includes(tag)) return; // sudah unlock, skip
        audioAchivement.play();

        const next = [...tags, tag];
        set({
          tags: next,
          toastTag: tag,
          canSave: true
        });
      },
      setTags: (newTags) => set({ tags: newTags }),

      dismissSave: () => set({ canSave: false }),
      dismissToast: () => set({ toastTag: null }),
      clearMessages: () => set({ messages: [], tags: [], canSave: false, toastTag: null }),
    }),
    {
      name: "chat-store",
      // Simpan ke localStorage hanya data persisten — bukan toastTag (ephemeral)
      partialize: (state) => ({
        messages: state.messages,
        tags: state.tags,
        canSave: state.canSave
      }),
    }
  )
);