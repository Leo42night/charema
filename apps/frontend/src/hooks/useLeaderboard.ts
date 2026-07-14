import { useEffect, useState } from "react";

// Samakan struktur tipe data dengan yang dikirim backend
export interface LeaderboardItem {
    nim: string;
    total_tags: number;
}

interface BroadcastPayload {
    type: string;
    data: LeaderboardItem[];
}

export function useLeaderboard(websocketUrl: string) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        if (!websocketUrl) return;

        // 1. Membuka koneksi ke AWS API Gateway WebSocket
        const ws = new WebSocket(websocketUrl);

        ws.onopen = () => {
            setIsConnected(true);
            console.log("WebSocket terhubung ke API Gateway");
        };

        // 2. MENANGKAP NILAI BROADCAST DI SINI
        ws.onmessage = (event) => {
            try {
                // Data dari backend (Buffer) otomatis diterima berupa string JSON oleh browser
                const payload: BroadcastPayload = JSON.parse(event.data);

                // Filter pesan berdasarkan properti 'type' yang dikirim backend Anda
                if (payload.type === "leaderboard_update") {
                    // Masukkan data array ke dalam state React
                    setLeaderboard(payload.data);
                }
            } catch (error) {
                console.error("Gagal membaca payload broadcast:", error);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log("WebSocket terputus");
        };

        // 3. Cleanup: Putus koneksi jika komponen tidak lagi dirender (unmount)
        return () => {
            ws.close();
        };
    }, [websocketUrl]);

    return { leaderboard, isConnected };
}
