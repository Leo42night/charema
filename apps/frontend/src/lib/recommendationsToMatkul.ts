import item_matkul from "@/data/item_matkul.json";
import category from "@/data/category.json";
import type { CategoryData, CategoryResult, ItemMatkul, MataKuliah, RecommendationResult } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMemo } from "react";

// kondisi sudah dapat akses modal select matkul (user & score pasti ada)
export function recommendationsToMatkul(): RecommendationResult | null {
    const itemMatkul = item_matkul as ItemMatkul;
    const categoryData = category as CategoryData;
    const recScores = useAuthStore((s) => s.recScores);
    const user = useAuthStore((s) => s.user);
    if (!user) return null;
    const prodi = user!.email.match(/^([a-zA-Z0-9]+)@/)![1].toUpperCase().slice(0, 3);

    // Matkul Result
    // Bungkus proses pembuatan data dengan useMemo
    const availableMatkuls = useMemo(() => {
        // Berikan guard clause jika recScores nilainya null atau undefined
        if (!recScores) return {} as Record<string, MataKuliah>;

        // Gunakan .reduce() untuk mengubah array menjadi format Record (Objek Map)
        return recScores.reduce<Record<string, MataKuliah>>((acc, [id, score], index) => {
            const found = id in itemMatkul['same']
                ? itemMatkul['same'][id]
                : itemMatkul[prodi]?.[id]; // Menggunakan ?. untuk keamanan data

            // Jika data mata kuliah tidak ditemukan di dataset json, skip agar tidak crash
            if (!found) return acc;

            // Gunakan string 'id' atau Number(id) sebagai KEY utama objek Record Anda
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

        // Masukkan semua variabel luar yang memengaruhi kalkulasi ini ke dalam array dependensi
    }, [recScores, itemMatkul, prodi]);

    // Category Result
    const categoryMap: Record<number, { totalScore: number; count: number }> = {};

    for (const mk of Object.values(availableMatkuls)) {
        // Validasi pengaman (Guard Clause) untuk memastikan data mk dan properti category eksis
        if (!mk || mk.category == null) continue;

        if (!categoryMap[mk.category]) {
            categoryMap[mk.category] = { totalScore: 0, count: 0 };
        }

        // Menggunakan Nullish Coalescing (?? 0) untuk menghindari error jika score bernilai null/undefined
        categoryMap[mk.category].totalScore += mk.score ?? 0;
        categoryMap[mk.category].count += 1;
    }

    const categories: CategoryResult[] = Object.entries(categoryMap)
        .map(([category, data]) => ({
            category: category,
            totalScore: data.totalScore,
            count: data.count
        }))
        .sort((a, b) => b.totalScore - a.totalScore); // Urutan descending

    // Ambil kategori teratas secara aman dengan optional chaining (?.)
    const topCategoryKey = categories[0]?.category;
    const category_matkuls = topCategoryKey ? categoryData.category[topCategoryKey] : undefined;

    return {
        matkuls: availableMatkuls,
        topCategoryKey,
        categories,
        // Jika category_matkuls ada, otomatis akan masuk ke dalam objek ini
        ...(category_matkuls && { category_matkuls })
    };
}