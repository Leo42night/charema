import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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