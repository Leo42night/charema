import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import type { DbClient } from "./types";
import user_cf_scores from "./data/user_cf_scores.json";
import user_to_nim from "./data/user_to_nim.json";
// import { getTfjsModelUrls } from "./aws-s3";

let prismaLocal: any;

async function initializeDatabase() {
  if (process.env.NODE_ENV === "dev") {
    const { Prisma } = await import("./generated/prisma/client");
    prismaLocal = Prisma;
  } else {
    const { Prisma } = await import("./generated/prisma-pg/client");
    prismaLocal = Prisma;
  }
}

const recommendations = user_cf_scores as Record<string, Record<string, number>>;
const userToNim = user_to_nim as Record<string, string>;

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Auth middleware — reusable di semua route yang butuh autentikasi
const makeAuthMiddleware = (jwtInstance: any) =>
  async ({ headers, set }: any) => {
    const authHeader = headers.authorization;
    if (!authHeader) {
      set.status = 401;
      return null;
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await jwtInstance.verify(token);

    if (!payload) {
      set.status = 401;
      return null;
    }

    return payload; // Ini akan berisi { id, user_key } yang tadi di-sign
  };

// Factory menerima `getPrisma` sebagai dependency injection
// sehingga dev pakai LibSQL, prod pakai PostgreSQL — tanpa mengubah routes
export const createApp = (getPrisma: () => DbClient) => {
  const app = new Elysia()
    .use(cookie())
    .use(
      jwt({
        name: "jwt",
        secret: process.env.JWT_SECRET || "mysecret",
        exp: "1d",
      })
    )

    // Middleware akses kontrol untuk /data
    .onRequest(({ request, set }) => {
      const url = new URL(request.url);
      console.log(`[DEBUG] [${request.method}] ${url.pathname}`);

      console.log("[DEBUG] AWS_LAMBDA_FUNCTION_NAME ", process.env.AWS_LAMBDA_FUNCTION_NAME);
      if (!process.env.AWS_LAMBDA_FUNCTION_NAME) return;

      // Lewati preflight OPTIONS
      if (request.method === "OPTIONS") return;

      if (!url.pathname.startsWith("/data")) return;

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

    // Health check
    .get("/", async (): Promise<ApiResponse<any>> => {
      const start = Date.now(); // 1. Mulai hitung waktu

      let dbStatus = "ok";
      let dbMessage = "connected";

      try {
        // 2. Cek koneksi database dengan query paling ringan ($queryRaw)
        const prisma = getPrisma();
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        dbStatus = "error";
        dbMessage = "database connection failed";
      }

      const responseTime = `${Date.now() - start}ms`; // 3. Hitung total durasi

      return {
        data: {
          version: "1.0.3",
          status: dbStatus === "ok" ? "ok" : "degraded",
          database: {
            status: dbStatus,
            message: dbMessage
          },
          uptime: process.uptime(), // Bonus: durasi server berjalan
          responseTime: responseTime
        },
        message: dbStatus === "ok" ? "server and database are running" : "database issue detected",
      };
    })

    .get("/test", async () => {
      const test = 1598;
      const data = recommendations[test.toString()];
      return { data, message: "Recom test" };
    })
    .get("/data/recom-target", async () => {
      const data = await getPrisma().recomTarget.findMany();
      return { data, message: "Recom targets retrieved successfully" };
    })
    .get("/data/score", async () => {
      const data = await getPrisma().score.findMany();
      return { data, message: "Score retrieved successfully" };
    })
    .get("/data/achievement", async () => {
      const data = await getPrisma().achievement.findMany();
      return { data, message: "Achievement retrieved successfully" };
    })
    .get("/data/feedback", async () => {
      const data = await getPrisma().feedback.findMany();
      return { data, message: "Feedback retrieved successfully" };
    })
    // for daily use
    .get("data/stats", async () => {
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
      >(prismaLocal.raw(query));

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
    // -- Post Routes --
    .post(
      "/recom-target",
      async ({ body, set }) => {
        try {
          // PERBAIKAN 1: Ambil 'matkul_ids' sesuai dengan nama di skema validasi
          const { user_key, matkul_ids } = body;

          // PERBAIKAN 3: Gunakan .upsert yang sesungguhnya agar data otomatis ter-update jika user_key sudah ada
          const result = await getPrisma().recomTarget.upsert({
            where: {
              user_key: user_key, // Kolom ini wajib memiliki indeks '@unique' di schema.prisma Anda
            },
            update: {
              matkul_ids, // Update field jika user_key sudah terdaftar
            },
            create: {
              user_key,
              matkul_ids, // Create field jika user_key belum ada
            },
          });

          return {
            data: result,
            message: "Recommendation target processed successfully (created/updated)",
          };
        } catch (error: any) {
          console.error("Prisma error:", error);
          set.status = 500;
          return {
            error: "Gagal menyimpan data ke database",
            detail: error.message,
          };
        }
      },
      {
        body: t.Object({
          user_key: t.Numeric(),
          // PERBAIKAN 2: Gunakan t.Array agar menerima format number[] dari frontend
          matkul_ids: t.Array(t.Integer(), { error: "matkul_ids harus berupa number[]" })
        })
      }
    )
    .post(
      "/progress",
      async ({ body, set }) => {
        try {
          const { user_key, score_cf, score_chat, tags } = body;

          // Menggunakan upsert agar jika user_key sudah ada, data akan diupdate (karena @id)
          const savedScore = await getPrisma().score.upsert({
            // 1. Kunci pencarian data berdasarkan primary key unik (user_key)
            where: {
              user_key,
            },
            // 2. Jika user_key SUDAH ADA, perbarui nilai skornya
            update: {
              score_cf,
              score_chat,
            },
            // 3. Jika user_key BELUM ADA, buat baris data baru
            create: {
              user_key,
              score_cf,
              score_chat,
            },
          });

          await getPrisma().achievement.upsert({
            where: { user_key },
            // Data yang akan dimasukkan jika data BELUM ada
            create: {
              user_key, // Jangan lupa masukkan field unique penanda relasi
              tags,
              // updatedAt otomatis terisi jika menggunakan @updatedAt di skema
            },
            // Data yang akan diperbarui jika data SUDAH ada
            update: {
              tags,
              updatedAt: new Date()
            },
          });

          return { data: savedScore, message: "Score & Tags saved successfully" };
        } catch (error: any) {
          set.status = 500;
          return { error: "Failed to save score", detail: error.message };
        }
      },
      {
        body: t.Object({
          user_key: t.Numeric({ error: "user_key harus berupa angka" }),
          score_cf: t.Numeric({ error: "score_cf harus berupa angka (1-5)" }),
          score_chat: t.Numeric({ error: "score_chat harus berupa angka (1-5)" }),
          tags: t.Array(
            t.String(),
            { error: "tags harus berupa array teks" }
          ),
        }),
      }
    )
    .post(
      "/feedback",
      async ({ body, set }) => {
        try {
          const { user_key, email, input, res_tag, res_message, feedback } = body;

          // 1. Validasi Kondisional: Jika user_key kosong, EMAIL WAJIB ADA
          if (!user_key && !email) {
            set.status = 400; // Bad Request, bukan 500
            return { error: "Gagal validasi", detail: "Email wajib diisi jika user_key tidak tersedia." };
          }

          // 2. Simpan ke database menggunakan Prisma
          await getPrisma().feedback.create({
            data: { user_key, email, input, res_tag, res_message, feedback },
          });

          let feedbackCount = 0;
          if (user_key) {
            feedbackCount = await getPrisma().feedback.count({
              where: {
                user_key: user_key,
              },
            });
          }

          return { count: feedbackCount, message: "Feedback submitted successfully" };
        } catch (error: any) {
          set.status = 500;
          return { error: "Failed to submit feedback", detail: error.message };
        }
      },
      {
        body: t.Object({
          user_key: t.Optional(t.Integer({ error: "user_key harus berupa angka bulat" })),
          email: t.Optional(t.String({ format: 'email', error: "Format email tidak valid" })),
          input: t.String({ error: "input teks wajib diisi" }),
          res_tag: t.String({ error: "res_tag wajib diisi" }),
          res_message: t.String({ error: "res_message wajib diisi" }),
          feedback: t.String({ error: "feedback wajib diisi" }),
        }),
      }
    )
    // Auth — Verify backend setelah login di frontend 
    .post("/auth/google", async ({ body, jwt }) => {
      const { access_token, user_data } = body;

      // 1. Ambil info user dari Google (Verifikasi Token)
      const resG = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const googleUser: any = await resG.json();

      if (!googleUser.email) throw new Error("Invalid Google Token");

      // 2. Buat JWT Session
      const sessionToken = await jwt.sign({ user_data });

      const responseData: any = {
        success: true,
        token: sessionToken
      };

      // 3. gunakan user_cf_scores.json, ambil rekomendasi berdasarkan user_key (jika ada)
      if (user_data.user_key) {
        responseData['recommendations'] = recommendations[user_data.user_key.toString()] || {};

        // 4. number feedback, ambil feedback by user_key
        responseData['user_feedback_number'] = await getPrisma().feedback.count({
          where: {
            user_key: user_data.user_key, // Kolom relasi user_key di tabel database
          },
        });

        // 5. ambil RecomTarget
        responseData['user_recomTarget_one'] = await getPrisma().recomTarget.findFirst({
          where: {
            user_key: user_data.user_key, // Kolom relasi user_key di tabel database
          }
        });
      }

      return responseData;
    }, {
      body: t.Object({
        access_token: t.String(),
        user_data: t.Object({
          name: t.String(),
          email: t.String(),
          picture: t.String(),
          user_key: t.Optional(t.Integer())
        })
      })
    })

  return app;
};