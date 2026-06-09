import type { CategoryMatkul, CategoryResult, MataKuliah, MataKuliahData, RecommendationResult } from "@/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import item_matkul from "@/data/item_matkul.json";
import category from "@/data/category.json";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// 🔧 format timestamp
export const formatTimestamp = (dateValue: number): string => {
    const date = new Date(dateValue);

    const hours = date
        .getHours()
        .toString()
        .padStart(2, "0");

    const minutes = date
        .getMinutes()
        .toString()
        .padStart(2, "0");

    const day = date.getDate();

    const month = date.toLocaleString("default", {
        month: "long",
    });

    return `${hours}:${minutes}, ${day} ${month}`;
};

/**
 * Cipher Module untuk Randomize dan Unrandomize String
 */
export const Cipher = {
    /**
     * Mengacak string menggunakan XOR cipher dan mengonversinya ke Hexadecimal
     */
    encode: (text: string, key: string): string => {
        if (!key) throw new Error("Key must not be empty");

        return Array.from(text)
            .map((char: string, i: number) => {
                const charCode: number = char.charCodeAt(0);
                const keyCode: number = key.charCodeAt(i % key.length);

                // Operasi XOR
                const scrambled: number = charCode ^ keyCode;

                // Return sebagai hex string 2 digit
                return scrambled.toString(16).padStart(2, '0');
            })
            .join('');
    },

    /**
     * Mengembalikan string Hexadecimal ke teks asli menggunakan Key
     */
    decode: (hex: string, key: string): string => {
        if (!key) throw new Error("Key must not be empty");

        // Pecah hex menjadi array tiap 2 karakter
        const hexPairs: RegExpMatchArray | null = hex.match(/.{1,2}/g);

        if (!hexPairs) return '';

        return hexPairs
            .map((hexChar: string, i: number) => {
                const charCode: number = parseInt(hexChar, 16);
                const keyCode: number = key.charCodeAt(i % key.length);

                // Operasi XOR (kebalikan)
                return String.fromCharCode(charCode ^ keyCode);
            })
            .join('');
    }
};

// 2. Definisikan struktur bersarangnya
// Kunci pertama ("H10") dan kunci kedua ("4") adalah string/nomor dinamis
type ItemMatkul = Record<string, Record<string, MataKuliahData>>;

// -- Category




type CategoryList = Record<string, CategoryMatkul[]>;

type CategoryMap = Record<string, string>;

interface CategoryData {
    category: CategoryList;
    category_map: CategoryMap;
}

export function recommendationsToMatkul(
    recommendations: Record<number, number>,
    prodi: string
): RecommendationResult {
    const itemMatkul = item_matkul as ItemMatkul;
    const categoryData = category as CategoryData;

    // Urutkan item_id berdasarkan score descending
    const sorted = Object.entries(recommendations)
        .sort(([, a], [, b]) => b - a);

    // Matkul Result
    const matkuls = sorted.map(([id, score], index): MataKuliah => {

        const found = id in itemMatkul['same']
            ? itemMatkul['same'][id]
            : itemMatkul[prodi][id]

        return {
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
            score: score, // tambahkan score untuk referensi
            rank: index + 1, // tambahkan peringkat berdasarkan urutan
        };
    });

    // Category Result
    const categoryMap: Record<number, { totalScore: number; count: number }> = {};

    for (const r of matkuls) {
        if (!categoryMap[r.category]) {
            categoryMap[r.category] = { totalScore: 0, count: 0 };
        }
        categoryMap[r.category].totalScore += r.score!;
        categoryMap[r.category].count += 1;
    }

    const categories: CategoryResult[] = Object.entries(categoryMap)
        .map(([category, data]) => ({
            category: category,
            name: categoryData.category_map[category],
            totalScore: data.totalScore,
            count: data.count
        }))
        .sort((a, b) => b.totalScore - a.totalScore); // Urutan descending

    // Ambil kategori teratas secara aman dengan optional chaining (?.)
    const topCategoryKey = categories[0]?.category;
    const category_matkuls = topCategoryKey ? categoryData.category[topCategoryKey] : undefined;

    return {
        matkuls,
        categories,
        // Jika category_matkuls ada, otomatis akan masuk ke dalam objek ini
        ...(category_matkuls && { category_matkuls })
    };
}

export function filterMatkul(list: MataKuliah[], keyword: string): MataKuliah[] {
    const kw = keyword.toLowerCase();
    return list.filter(
        (mk) =>
            mk.matkul.toLowerCase().includes(kw) ||
            mk.kode?.toLowerCase().includes(kw) ||
            mk.dosen?.toLowerCase().includes(kw)
    );
}