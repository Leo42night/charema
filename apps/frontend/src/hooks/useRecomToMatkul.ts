// lib/useRecommendationsToMatkul.ts
import { useMemo } from "react";
import item_matkul from "@/data/item_matkul.json";
import category from "@/data/category.json";
import type { CategoryData, CategoryResult, ItemMatkul, MataKuliah, RecommendationResult } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { getProdi } from "@/lib/getProdi";

export function useRecomToMatkul(): RecommendationResult | null {
    const itemMatkul = item_matkul as ItemMatkul;
    const categoryData = category as CategoryData;
    const recScores = useAuthStore((s) => s.recScores);
    const user = useAuthStore((s) => s.user);

    return useMemo(() => {
        if (!user || !recScores) return null;

        const prodi = getProdi(user.user_key!, user.email);

        const availableMatkuls = recScores.reduce<Record<string, MataKuliah>>((acc, [id, score], index) => {
            const found = id in itemMatkul['same']
                ? itemMatkul['same'][id]
                : itemMatkul[prodi]?.[id];

            if (!found) return acc;

            acc[id] = {
                item: Number(id),
                matkul: found.matkul,
                dosen: found.dosen,
                tahun: found.tahun,
                sm: found.sm,
                category: found.category,
                kode: found.kode,
                sks: found.sks,
                semester: found.semester ?? null,
                prasyarat: found.prasyarat ?? null,
                wajib: found.wajib ?? null,
                score: score,
                rank: index + 1,
            };

            return acc;
        }, {});

        const categoryMap: Record<number, { totalScore: number; count: number }> = {};

        for (const mk of Object.values(availableMatkuls)) {
            if (!mk || mk.category == null) continue;
            if (!categoryMap[mk.category]) {
                categoryMap[mk.category] = { totalScore: 0, count: 0 };
            }
            categoryMap[mk.category].totalScore += mk.score ?? 0;
            categoryMap[mk.category].count += 1;
        }

        const categories: CategoryResult[] = Object.entries(categoryMap)
            .map(([category, data]) => ({
                category,
                totalScore: data.totalScore,
                count: data.count
            }))
            .sort((a, b) => b.totalScore - a.totalScore);

        const topCategoryKey = categories[0]?.category;
        const category_matkuls = topCategoryKey ? categoryData.category[topCategoryKey] : undefined;

        return {
            matkuls: availableMatkuls,
            topCategoryKey,
            categories,
            ...(category_matkuls && { category_matkuls })
        };
    }, [recScores, user]);
}