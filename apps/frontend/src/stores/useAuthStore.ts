import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "../types";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            recommendations: null,
            availableMatkuls: [],
            setAvailableMatkuls: (matkuls) => set({availableMatkuls: matkuls}),
            selectedMatkulItems: [],
            setSelectedMatkulItems: (selectedMatkulItems) => set({selectedMatkulItems}),
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
