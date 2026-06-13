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
          email: t.Optional(t.String()),
          input: t.String(),
          res_tag: t.String(),
          res_message: t.String(),
          feedback: t.String(),
        }),
      }
    )


  return app;
};