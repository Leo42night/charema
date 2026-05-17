import type { MataKuliah, NilaiPrasyaratEntry } from "@/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import nilaiPrasyarat from "@/data/matkul_prasyarat_with_item.json";
import itemMatkuls from "@/data/item_matkuls_list.json";

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


type ItemMatkulsList = Record<string, string[]>;
export function recommendationsToMatkul(
    recommendations: Record<number, number>
): MataKuliah[] {
    const prasyaratList = nilaiPrasyarat as NilaiPrasyaratEntry[];
    // console.log("prasyaratList", prasyaratList);
    const matkulsList = itemMatkuls as ItemMatkulsList;
    // console.log("matkulsList", matkulsList);

    // Urutkan item_id berdasarkan score descending
    const sorted = Object.entries(recommendations)
        .sort(([, a], [, b]) => b - a)
        .map(([itemId]) => Number(itemId));

    return sorted.map((itemId, index): MataKuliah => {
        // Cari di nilai_prasyarat by item (float → cocokkan dengan Number)
        const found = prasyaratList.find((e) => Number(e.item) === itemId);

        if (found) {
            return {
                item: found.item,
                nama: found.matkul,
                kode: found.kode || null,
                sks: found.sks ?? null,
                semester: found.semester ?? null,
                dosen: null, // data dosen tidak tersedia di JSON, jadi null
                score: recommendations[itemId], // tambahkan score untuk referensi
                rank: index + 1, // tambahkan peringkat berdasarkan urutan
            };
        }

        // Fallback: ambil nama dari item_matkuls_list
        const names = matkulsList[String(itemId)];
        return {
            item: itemId,
            nama: names?.[0] ?? `Item #${itemId}`,
            kode: null,
            sks: null,
            semester: null,
            dosen: null,
            score: recommendations[itemId], // tambahkan score untuk referensi
            rank: index + 1, // tambahkan peringkat berdasarkan urutan
        };
    });
}

export function filterMatkul(list: MataKuliah[], keyword: string): MataKuliah[] {
    const kw = keyword.toLowerCase();
    return list.filter(
        (mk) =>
            mk.nama.toLowerCase().includes(kw) ||
            mk.kode?.toLowerCase().includes(kw) ||
            mk.dosen?.toLowerCase().includes(kw)
    );
}