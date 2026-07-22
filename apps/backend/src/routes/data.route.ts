import { Elysia, t } from "elysia";
import { TARGET_KRITIK, TARGET_TAGS, userToNim } from "shared";
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
        // Middleware khusus untuk grup /data (terlindung guard() jadi tidak merambah ke route diluar)
        .guard({
            beforeHandle: ({ request, set }) => {
                const url = new URL(request.url);
                // console.log(`[DEBUG] [${request.method}] ${url.pathname}`);

                if (request.method === "OPTIONS") return;

                const origin = request.headers.get("origin");
                const frontendUrlsRaw = process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:4173";
                if (frontendUrlsRaw) {
                    const allowedOrigins: string[] = frontendUrlsRaw.split(",");
                    if (allowedOrigins.includes(origin ?? '')) {
                        // Logic jika origin diizinkan (misal untuk CORS atau bypass)
                        return;
                    }
                }
                const key = url.searchParams.get("key");


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
                    const uniqueUsers = await getPrisma().recomTarget.findMany({
                        distinct: ['user_key'],
                        select: { user_key: true },
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

                    // winner
                    const winner = await getPrisma().winner.findFirst();
                    if (winner) {
                        const dataUser = await getPrisma().user.findFirst({ where: { user_key: winner.user_key } });
                        responseData['winner'] = {
                            user_key: winner.user_key,
                            created_at: winner.created_at,
                            name: dataUser?.name,
                            picture: dataUser?.picture
                        }
                    }

                    // top 10 user achievement: n tags achieved
                    const isProduction = process.env.NODE_ENV !== 'dev';

                    const query = `
                        SELECT 
                        "user_key", 
                        ${isProduction ? "jsonb_array_length" : "json_array_length"}("tags") AS "total_tags"
                        FROM "Achievement"
                        WHERE "user_key" != 4404
                        ORDER BY "total_tags" DESC, "created_at" ASC
                        LIMIT 10;
                    `;

                    const topUsers = await getPrisma().$queryRaw<
                        { user_key: number; total_tags: number }[]
                    >(PrismaNamespace.raw(query));

                    const topUsersWithNim = await Promise.all(
                        topUsers.map(async (user) => {
                            const totalKritik = await getPrisma().feedback.count({
                                where: { user_key: user.user_key },
                            });

                            const userScore = await getPrisma().score.findFirst({
                                where: { user_key: user.user_key },
                            });

                            return {
                                user_key: user.user_key,
                                total_tags: Number(user.total_tags), // Memastikan tipe data berupa number
                                total_kritik: totalKritik, // jumlah kritik dibuat
                                is_scoring: !!userScore, // punya riwayat rating
                            };
                        })
                    );

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
                    try {
                        const data = await getPrisma().achievement.findMany();
                        return { data, message: "Achievement retrieved successfully" };
                    } catch (err: any) {
                        console.error("DB ERROR:", err.message);
                        console.error("CODE:", err.code);
                        console.error(err);
                        throw err;
                    }
                })
                .get("/feedback", async () => {
                    const data = await getPrisma().feedback.findMany();
                    return { data, message: "Feedback retrieved successfully" };
                })
                // untuk accordion leaderboard
                .get("/user/:user_key", async ({ params, set }) => {
                    const userKey = params.user_key;

                    const data = await getPrisma().user.findFirst({
                        where: { user_key: userKey },
                    });

                    if (!data) {
                        set.status = 404;
                        return { data: null, message: "User tidak ditemukan" };
                    }

                    return { data, message: "User retrieved successfully" };
                }, {
                    params: t.Object({
                        user_key: t.Number()
                    })
                })
                // DEBUG: lihat di browser
                .get("/winner/:user_key", async ({ params, set }) => {
                    const user_key = params.user_key;

                    const tags = (await getPrisma().achievement.findUnique({
                        where: { user_key },
                    }))?.tags;

                    if (!tags) {
                        set.status = 404;
                        return { data: null, message: "tidak ada riwayat" };
                    }

                    // jika tags length sudah 20, simpan ke winner
                    let res_data: {
                        is_win: boolean;
                        n_tags: number;
                        feedback?: number;
                        score?: boolean;
                    } = {
                        is_win: false,
                        n_tags: tags.length
                    };
                    if (tags.length >= TARGET_TAGS) {
                        // periksa jika score ada, feedback >= 4
                        const feedback = await getPrisma().feedback.count({ where: { user_key } });
                        res_data.feedback = feedback;
                        if (feedback >= TARGET_KRITIK) {
                            const score = await getPrisma().score.findFirst({ where: { user_key } });
                            res_data.score = !!score;
                            if (score !== null) {
                                res_data.is_win = true;
                            }
                        }
                    }
                    return { data: res_data };

                }, {
                    params: t.Object({
                        user_key: t.Number()
                    })
                })
                // DEBUG: cek env (lihat di browser)
                .get("/env", async () => {
                    // Tambahkan di baris awal src/server-pg.ts
                    console.log("=== CHECKING LOADED ENV ===");
                    console.log("NODE_ENV:", process.env.NODE_ENV);
                    console.log("FRONTEND_URLS:", process.env.FRONTEND_URLS);
                    console.log("===========================");
                })

        );
