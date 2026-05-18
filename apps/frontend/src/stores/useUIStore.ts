import { formatTimestamp } from "@/lib/utils";
import type { MataKuliah } from "@/types";
import { create } from "zustand";

// 1. Definisikan struktur state dan fungsinya
interface UIState {
  menuOpen: boolean;
  isNavbarVisible: boolean;
  modalScore: boolean;
  isOnline: boolean;
  msgCount: number;
  selectedMK: MataKuliah[];
  activeMenu: string;
  feedbackInput: string;

  // Actions (Fungsi Pengubah State)
  setMenuOpen: (open: boolean) => void;
  setNavbarVisible: (visible: boolean) => void;
  setModalScore: (open: boolean) => void;
  setOnline: (online: boolean) => void;
  setMsgCount: (count: number | ((prev: number) => number)) => void;
  setSelectedMK: (selectedMK: MataKuliah[]) => void;
  setActiveMenu: (menu: string) => void;
  setFeedbackInput: (input: string) => void;
  resetChat: (chatPresenter: any) => void;
}

// 2. Buat store dengan Zustand
export const useUIStore = create<UIState>((set) => ({
  // Initial States
  menuOpen: false,
  isNavbarVisible: true,
  modalScore: false,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  msgCount: 0,
  selectedMK: [],
  activeMenu: "Home",
  feedbackInput: "",

  // Implementasi Fungsi
  setMenuOpen: (open) => set({ menuOpen: open }),
  setNavbarVisible: (visible) => set({ isNavbarVisible: visible }),
  setModalScore: (open) => set({ modalScore: open }),
  setOnline: (online) => set({ isOnline: online }),

  // Mendukung update berbasis nilai langsung atau callback function (seperti prev => prev + 1)
  setMsgCount: (count) =>
    set((state) => ({
      msgCount: typeof count === "function" ? count(state.msgCount) : count
    })),
  setSelectedMK: (selectedMK) => set({selectedMK}),

  setActiveMenu: (menu) => set({ activeMenu: menu }),
  setFeedbackInput: (input) => set({ feedbackInput: input }),

  resetChat: (chatPresenter) => {
    chatPresenter.clearMessages();
    set({selectedMK: []});
    setTimeout(() => {
      chatPresenter.setMessages([{
        id: Date.now() + 1,
        role: "assistant",
        content: "Chat baru dimulai. Mari kita ulangi 👍. Mau lihat tutorial?",
        timestamp: formatTimestamp(Date.now()),
        showTourButton: true
      }]);
    }, 300);
  },
}));
