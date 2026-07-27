import { create } from "zustand";
import { persist } from "zustand/middleware";
import { formatTimestamp } from "@/lib/utils";
import type { MataKuliah } from "@/types";

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
  showWinnerModal: boolean;
  showCalonWinnerModal: boolean;
  hasBeenWinner: boolean;
  hasBeenCalonWinner: boolean;

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
  setShowWinnerModal: (status: boolean) => void;
  setHasBeenWinner: (status: boolean) => void;
  setShowCalonWinnerModal: (status: boolean) => void;
  setHasBeenCalonWinner: (status: boolean) => void;
}

// 2. Buat store dengan Zustand
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial States
      menuOpen: false,
      isNavbarVisible: true,
      modalScore: false,
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      msgCount: 0,
      selectedMK: [],
      activeMenu: "Home",
      feedbackInput: "",
      hasBeenWinner: false,
      hasBeenCalonWinner: false,
      showWinnerModal: false,
      showCalonWinnerModal: false,

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
      setSelectedMK: (selectedMK) => set({ selectedMK }),

      setActiveMenu: (menu) => set({ activeMenu: menu }),
      setFeedbackInput: (input) => set({ feedbackInput: input }),

      resetChat: (chatPresenter) => {
        chatPresenter.clearMessages();
        set({ selectedMK: [] });
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

      setHasBeenWinner: (status) => set({ hasBeenWinner: status }),
      setHasBeenCalonWinner: (status) => set({ hasBeenCalonWinner: status }),
      setShowWinnerModal: (statusWinner) => set({ showWinnerModal: statusWinner }),
      setShowCalonWinnerModal: (statusCalonWinner) => set({ showCalonWinnerModal: statusCalonWinner })
    }), {
    name: "ui-store",
    partialize: (state) => ({
      hasBeenWinner: state.hasBeenWinner,
      hasBeenCalonWinner: state.hasBeenCalonWinner,
    }),
  }
  )
);
