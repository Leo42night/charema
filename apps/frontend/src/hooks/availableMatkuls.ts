import { useMemo } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { recommendationsToMatkul } from "@/lib/utils"; // sesuaikan path fungsi Anda

export const useAvailableMatkuls = () => {
    const recommendations = useAuthStore((state) => state.recommendations);

    const availableMatkuls = useMemo(
        () => recommendationsToMatkul(recommendations ?? {}),
        [recommendations]
    );

    return availableMatkuls;
};
