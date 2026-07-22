// src/ws/broadcast.ts
import { DynamoDBClient, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import type { DbClient } from "../types";

const ddb = new DynamoDBClient({});

let apiGw: ApiGatewayManagementApiClient | null = null;
function getApiGw() { // lazy load, jadi env dimuat setelah loadConfig() selesai jalan, bukan saat import
    if (!apiGw) {
        // Endpoint ini beda dari WebSocket URL yang dipakai client!
        apiGw = new ApiGatewayManagementApiClient({
            endpoint: process.env.WS_MANAGEMENT_ENDPOINT!,
        });
    }
    return apiGw;
}

export async function broadcastLeaderboard(getPrisma: () => DbClient, userToNim: Record<number, string>) {
    // console.log("=== Memulai Test Koneksi Database ===");

    // 1. QUERY VERSI ORM (AMAN UNTUK POSTGRES & SQLITE)
    // Kita ambil semua data dulu secara sederhana tanpa fungsi JSON database
    const allAchievements = await getPrisma().achievement.findMany({
        select: {
            user_key: true,
            tags: true
        }
    });

    // console.log(`Berhasil membaca ${allAchievements.length} data dari database.`);

    // 2. HITUNG PANJANG ARRAY MENGGUNAKAN JAVASCRIPT (Lebih Aman & Anti-Crash)
    const topUsers = allAchievements.map((item: any) => {
        let totalTags = 0;
        try {
            // Jika di SQLite data berupa string, kita parse dulu. Jika di Postgres sudah berupa objek/array.
            const parsedTags = typeof item.tags === "string" ? JSON.parse(item.tags) : item.tags;
            if (Array.isArray(parsedTags)) {
                totalTags = parsedTags.length;
            }
        } catch (e) {
            // Jaga-jaga jika format JSON di kolom tags rusak
            totalTags = 0;
        }

        return {
            user_key: item.user_key,
            total_tags: totalTags
        };
    });

    // Urutkan dari tags terbanyak (DESC) dan ambil 10 besar
    // urutkat juga berdasarkan created_at (ASC)
    const top10Users = topUsers
        .sort((a, b) => b.total_tags - a.total_tags)
        .slice(0, 10);

    // 3. MAP KE NIM
    const topUsersWithNim = top10Users.map((user) => ({
        nim: userToNim[user.user_key] || "TIDAK DIKETAHUI",
        total_tags: user.total_tags,
    }));

    // console.log("Hasil Top 10 Terproses:", topUsersWithNim);

    const payload = JSON.stringify({
        type: "leaderboard_update",
        data: topUsersWithNim,
    });

    // 4. BAGIAN BROADCAST KE DYNAMODB (Tetap sama)
    const { Items } = await ddb.send(new ScanCommand({ TableName: "ws-connections" }));
    const connectionIds = (Items ?? [])
        .map((item) => item.connectionId?.S)
        .filter((id): id is string => id !== undefined);

    // console.log(`Mengirim broadcast ke ${connectionIds.length} client aktif.`);

    await Promise.all(
        connectionIds.map(async (connectionId) => {
            try {
                await getApiGw().send(new PostToConnectionCommand({
                    ConnectionId: connectionId,
                    Data: Buffer.from(payload),
                }));
            } catch (err: any) {
                if (err?.name === "GoneException") {
                    await ddb.send(new DeleteItemCommand({
                        TableName: "ws-connections",
                        Key: { connectionId: { S: connectionId } },
                    }));
                } else {
                    console.error(`Gagal kirim ke ${connectionId}:`, err);
                }
            }
        })
    );
}
