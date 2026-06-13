import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserData } from "../types";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

interface RatingData {
    score_cf: number;
    score_chat: number;
}

export interface AuthState {
    user: UserData | null;
    token: string | null;
    recScores: [string, number][] | null; // dari BE user_cf_scores.json
    selectedMatkulItems: number[]; // di modal select matkul 
    rating: RatingData | null;
    feedbackNumber: number; // ambil dari database backend

    setAuth: (user: UserData, token: string) => void;
    setRecScores: (scores: [string, number][] | null) => void;
    setSelectedMatkulItems: (items: number[]) => void;
    setFeedbackNumber: (updater: number | ((prev: number) => number)) => void;
    setRating: (rating: RatingData) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    // cache to localhost
    persist(
        (set) => ({
            user: null,
            token: null,
            recScores: null,
            selectedMatkulItems: [], // riwayat matkul yang di select
            rating: null,
            feedbackNumber: 0,
            setAuth: (user, token) => set({ user, token }),
            setRecScores: (scores) => set({ recScores: scores }),
            setSelectedMatkulItems: (selectedMatkulItems) => set({ selectedMatkulItems }),

            setFeedbackNumber: (updater) =>
                set((state) => ({
                    feedbackNumber:
                        typeof updater === "function" ? updater(state.feedbackNumber) : updater,
                })),

            setRating: (rating) => set({ rating }),


            logout: () => {
                set({ user: null, token: null, recScores: null, selectedMatkulItems: [], rating: null, feedbackNumber: 0 })
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
