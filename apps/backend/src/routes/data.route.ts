import { Elysia } from "elysia";
import { userToNim } from "shared";
import user_cf_scores from "../data/user_cf_scores.json";
import type { DbClient } from "../types"; // Sesuaikan dengan lokasi tipe DbClient Anda
const recommendations = user_cf_scores as Record<string, Record<string, number>>;

let PrismaNamespace: any;

async function initializeDatabase() {
    if (process.env.NODE_ENV === "dev") {
        const mod = await import("../generated/prisma/client");
        PrismaNamespace = mod.Prisma;
    } else {
        const mod = await import("../generated/prisma-pg/client");
        PrismaNamespace = mod.Prisma;
        //      ^^^^^^ ini namespace, berisi Prisma.raw, Prisma.sql, dll
    }
}

export const dataRoutes = (getPrisma: () => DbClient) =>
    new Elysia({ prefix: "/data" }) // Otomatis menambahkan prefix /data di semua rute di dalam file ini
        // Middleware khusus untuk grup /data
        .onRequest(({ request, set }) => {
            const url = new URL(request.url);
            console.log(`[DEBUG] [${request.method}] ${url.pathname}`);

            console.log("[DEBUG] AWS_LAMBDA_FUNCTION_NAME ", process.env.AWS_LAMBDA_FUNCTION_NAME);
            if (!process.env.AWS_LAMBDA_FUNCTION_NAME) return;

            // Lewati preflight OPTIONS
            if (request.method === "OPTIONS") return;

            // Sisa pengecekan origin dan API Key
            const origin = request.headers.get("origin");
            const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
            const key = url.searchParams.get("key");

            if (origin === frontendUrl) return;

            const apiKey = process.env.API_KEY || "ok";
            if (key !== apiKey) {
                set.status = 401;
                return { message: "Unauthorized: Access denied without valid API Key" };
            }
        })
        // Middleware khusus untuk grup /data
        .guard({
            beforeHandle: ({ request, set }) => {
                const url = new URL(request.url);
                console.log(`[DEBUG] [${request.method}] ${url.pathname}`);

                if (request.method === "OPTIONS") return;

                const origin = request.headers.get("origin");
                const frontendUrl = process.env.FRONTEND_URL!;
                const key = url.searchParams.get("key");

                // Jika request datang dari Frontend resmi, izinkan lewat
                if (origin === frontendUrl) return;

                // Validasi API Key untuk request non-frontend (misal: Insomnia, Postman, service lain)
                const apiKey = process.env.API_KEY!;
                if (key !== apiKey) {
                    set.status = 401;
                    return { message: "Unauthorized: Access denied without valid API Key" };
                }
            }
        }, (app) =>
            app
                // untuk halaman about
                .get("/stats", async () => {
                    await initializeDatabase();
                    const responseData: any = {}
                    // n user sukses doing recomendation from all user
                    const uniqueUsers = await getPrisma().recomTarget.groupBy({
                        by: ['user_key'],
                    });

                    // Panjang array uniqueUsers merepresentasikan jumlah user_key yang unik
                    responseData['n_rec_users'] = uniqueUsers.length;


                    // 3. Inisialisasi struktur object untuk 6 group
                    const groups: Record<string, number> = {
                        "sisfo23": 0, "sisfo24": 0, "sisfo25": 0,
                        "siskom23": 0, "siskom24": 0, "siskom25": 0
                    };

                    // 4. Looping setiap user_key dari database dan kelompokkan
                    uniqueUsers.forEach((user: any) => {
                        const userKey = user.user_key;
                        const nim = userToNim[userKey]; // Ambil NIM berdasarkan user_key

                        if (nim) {
                            // Ambil prodi berdasarkan prefix
                            let prodi = "";
                            if (nim.startsWith("H11")) {
                                prodi = "sisfo";
                            } else if (nim.startsWith("H10")) {
                                prodi = "siskom";
                            }

                            // Ambil angkatan dari indeks ke 5 & 6 (contoh: H1051231002 -> "23")
                            // Karena string di JS berbasis indeks 0, karakter ke-5 & 6 adalah .substring(5, 7)
                            const angkatan = nim.substring(5, 7);

                            // Gabungkan menjadi nama grup (ex: sisfo23, siskom24)
                            const groupKey = `${prodi}${angkatan}`;

                            // Jika grupnya valid (sesuai target 6 grup), masukkan ke dalam hitungan
                            if (groups[groupKey] !== undefined) {
                                groups[groupKey]++;
                            }
                        }
                    });

                    // 5. Masukkan hasil pengelompokan ke responseData
                    responseData['demographics'] = groups;


                    // n feedback submitted
                    responseData['n_feedback'] = await getPrisma().feedback.count();
                    // top 10 user achievement: n tags achieved
                    const isProduction = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

                    const query = `
                        SELECT 
                        "user_key", 
                        json${isProduction ? "b" : ""}_array_length("tags") AS "total_tags"
                        FROM "Achievement"
                        ORDER BY "total_tags" DESC
                        LIMIT 10;
                    `;

                    const topUsers = await getPrisma().$queryRaw<
                        { user_key: number; total_tags: number }[]
                    >(PrismaNamespace.raw(query));

                    const topUsersWithNim = topUsers.map(user => {
                        // Ambil nim berdasarkan user_key (convert ke string karena key JSON adalah string)
                        const nim = userToNim[user.user_key] || "TIDAK DIKETAHUI";

                        return {
                            nim: nim,
                            total_tags: Number(user.total_tags) // Memastikan tipe data berupa number
                        };
                    });

                    // Output responseData siap dikirim ke frontend
                    responseData['top_10_users'] = topUsersWithNim;


                    // -- score rating curve (chat & rekomendation)
                    const aggregation = await getPrisma().score.aggregate({
                        _avg: {
                            score_chat: true,
                            score_cf: true,
                        },
                        _count: {
                            user_key: true,
                        },
                    });

                    // Format ke dalam responseData
                    responseData['scores_stats'] = {
                        avg_score_chat: aggregation._avg.score_chat ?? 0,
                        avg_score_cf: aggregation._avg.score_cf ?? 0, // jika null, fallback ke 0
                        total_users: aggregation._count.user_key,
                    };

                    responseData['message'] = "Feedback retrieved successfully";

                    return responseData;
                })
                .get("/test-score", async () => {
                    const test = '4404';
                    const data = recommendations[test];
                    return { data, message: `Recom [${test} | ${userToNim[test]}] test user_cf_scores` };
                })
                .get("/recom-target", async () => {
                    const data = await getPrisma().recomTarget.findMany();
                    return { data, message: "Recom targets retrieved successfully" };
                })
                .get("/score", async () => {
                    const data = await getPrisma().score.findMany();
                    return { data, message: "Score retrieved successfully" };
                })
                .get("/achievement", async () => {
                    const data = await getPrisma().achievement.findMany();
                    return { data, message: "Achievement retrieved successfully" };
                })
                .get("/feedback", async () => {
                    const data = await getPrisma().feedback.findMany();
                    return { data, message: "Feedback retrieved successfully" };
                })
        );
