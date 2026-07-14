import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import type { ApiResponse, HealthCheck } from "shared";
import user_cf_scores from "./data/user_cf_scores.json";
import type { DbClient } from "./types";
import { dataRoutes } from "./routes/data.route";

const recommendations = user_cf_scores as Record<string, Record<string, number>>;

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
    .use(dataRoutes(getPrisma))
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
    // -- Post Routes --
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

        // 4.a. number feedback, ambil feedback by user_key (opsi 1)
        responseData['user_feedback_number'] = await getPrisma().feedback.count({
          where: {
            user_key: user_data.user_key, // Kolom relasi user_key di tabel database
          },
        });

        // 5. ambil RecomTarget
        responseData['user_recomTarget_one'] = await getPrisma().recomTarget.findFirst({
          where: {
            user_key: user_data.user_key, // Kolom relasi user_key di tabel database
          },
          orderBy: {
            created_at: 'desc', // updated_at akan di update
          }
        });

        // 6. ambil Tags Achivement
        responseData['user_achievement'] = (await getPrisma().achievement.findUnique({
          where: {
            user_key: user_data.user_key,
          },
        }))?.tags;
      } else if (user_data.email) {
        // 4.b. number feedback, ambil feedback by email (opsi 2, bukan target)
        responseData['user_feedback_number'] = await getPrisma().feedback.count({
          where: {
            email: user_data.email, // Kolom relasi user_key di tabel database
          },
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
    .post(
      "/recom-target",
      async ({ body, set }) => {
        try {
          // PERBAIKAN 1: Ambil 'matkul_ids' sesuai dengan nama di skema validasi
          const { user_key, matkul_ids } = body;

          // Cek jumlah data untuk user_key ini
          const count = await getPrisma().recomTarget.count({
            where: { user_key },
          });

          let result;

          if (count >= 3) {
            // Sudah 3 atau lebih → update yang terbaru
            const latest = await getPrisma().recomTarget.findFirst({
              where: { user_key },
              orderBy: { created_at: 'desc' },
            });

            result = await getPrisma().recomTarget.update({
              where: { id: latest!.id },
              data: { matkul_ids },
            });

            return {
              data: result,
              message: "Recommendation updated",
            };
          } else {
            // Belum 3 → buat baru
            result = await getPrisma().recomTarget.create({
              data: {
                user_key,
                matkul_ids,
              },
            });
            return {
              data: result,
              message: "Recommendation created",
            };
          }

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
    // Save Progress achievement Tags
    .post(
      "/achievement",
      async ({ body, set }) => {
        try {
          const { user_key, tags } = body;

          await getPrisma().achievement.upsert({
            where: { user_key },
            // Data yang akan dimasukkan jika data BELUM ada
            create: {
              user_key, // Jangan lupa masukkan field unique penanda relasi
              tags,
            },
            // Data yang akan diperbarui jika data SUDAH ada
            update: {
              tags // time update pakai created_at di score
            },
          });

          return { message: "Score & Tags saved successfully" };
        } catch (error: any) {
          set.status = 500;
          return { error: "Failed to save score", detail: error.message };
        }
      },
      {
        body: t.Object({
          user_key: t.Numeric({ error: "user_key harus berupa angka" }),
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

          // 2. Buat where clause berdasarkan user_key atau email
          const whereClause = user_key
            ? { user_key }
            : { email: email! };

          // 3. Cek jumlah feedback
          let count = await getPrisma().feedback.count({ where: whereClause });

          if (count >= 4) {
            // Update yang terlama
            const oldest = await getPrisma().feedback.findFirst({
              where: whereClause,
              orderBy: { created_at: 'asc' },
            });

            await getPrisma().feedback.update({
              where: { id: oldest!.id },
              data: { input, res_tag, res_message, feedback },
            });
          } else {
            // Buat baru
            await getPrisma().feedback.create({
              data: { user_key, email, input, res_tag, res_message, feedback },
            });
            count = count + 1;
          }
          return { count, message: "Feedback submitted" };
        } catch (error: any) {
          set.status = 500;
          return { error: "Failed to submit feedback", detail: error.message };
        }
      },
      {
        body: t.Object({
          user_key: t.Optional(t.Integer({ error: "user_key harus berupa angka bulat" })),
          email: t.Optional(t.String()),
          input: t.String(),
          res_tag: t.String(),
          res_message: t.String(),
          feedback: t.String(),
        }),
      }
    )
    // Save Score (rating)
    .post(
      "/score",
      async ({ body, set }) => {
        try {
          const { user_key, score_cf, score_chat, message } = body;

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
              ...(message !== undefined && { message }),
              created_at: new Date() // key update untuk achievement juga
            },
            // 3. Jika user_key BELUM ADA, buat baris data baru
            create: {
              user_key,
              score_cf,
              score_chat,
              ...(message !== undefined && { message }),
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
          message: t.Optional(t.String()),
        }),
      }
    )

  return app;
};