import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserData, MataKuliah } from "../types";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";


interface RatingData {
    score_cf: number;
    score_chat: number;
}

export interface AuthState {
    user: UserData | null;
    token: string | null;
    recommendations: Record<number, number> | null;
    availableMatkuls: MataKuliah[];
    setAvailableMatkuls: (matkuls: MataKuliah[]) => void;
    selectedMatkulItems: number[];
    setSelectedMatkulItems: (items: number[]) => void;
    rating: RatingData | null;

    feedbackNumber: number; // ambil dari database backend
    setFeedbackNumber: (updater: number | ((prev: number) => number)) => void;


    setRecommendations: (recs: Record<number, number>) => void;
    setRating: (rating: RatingData) => void;
    setAuth: (user: UserData, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            recommendations: null,
            availableMatkuls: [],
            setAvailableMatkuls: (matkuls) => set({ availableMatkuls: matkuls }),
            selectedMatkulItems: [],
            setSelectedMatkulItems: (selectedMatkulItems) => set({ selectedMatkulItems }),
            rating: null,

            feedbackNumber: 0,
            setFeedbackNumber: (updater) =>
                set((state) => ({
                    feedbackNumber:
                        typeof updater === "function" ? updater(state.feedbackNumber) : updater,
                })),

            setRecommendations: (recs) => set({ recommendations: recs }),
            setRating: (rating) => set({ rating }),

            setAuth: (user, token) => set({ user, token }),

            logout: () => {
                set({ user: null, token: null, recommendations: null, rating: null, feedbackNumber: 0, availableMatkuls: [] })
                useChatStore.getState().clearMessages();
                useChatStore.getState().clearAchievements();
                toast("Logged out successfully");
            },
        }),
        {
            name: "auth-cache-storage", // Nama key yang akan muncul di localStorage
        }
    )
);
