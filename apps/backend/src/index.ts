import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import type { DbClient, NimToUser } from "./types";
import user_cf_results from "./data/user_cf_results.json";
import { getTfjsModelUrls } from "./aws-s3";

const recommendations = user_cf_results as Record<string, Record<string, number>>;

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface UserPayload {
  user_data: {
    name: string;
    email: string;
    picture: string;
  }
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

    // Middleware akses kontrol untuk /users
    .onRequest(({ request, set }) => {
      const url = new URL(request.url);
      console.log(`[DEBUG] [${request.method}] ${url.pathname}`);

      // Lewati preflight OPTIONS
      if (request.method === "OPTIONS") return;

      if (!url.pathname.startsWith("/users")) return;

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

    .get("/model-chatbot", async () => {
      return getTfjsModelUrls();
    })

    // -- Database Routes --
    .get("/recom-option/:user_key", async ({ headers, jwt, status, params }) => {
      // 1. Ambil token dari header 'Authorization'
      const authHeader = headers['authorization'];
      const { user_key } = params;
      if (!authHeader) return status(401, "Token required");

      const token = authHeader.split(' ')[1]; // Memisahkan 'Bearer' dari 'TOKEN'

      // 2. Verifikasi Token
      const payload = await jwt.verify(token);

      if (!payload) return status(401, "Invalid or expired token");

      if (!user_key) return status(400, "User key not found in token");

      // 4. Gunakan user_key untuk ambil data dari database atau JSON
      return {
        success: true,
        data: recommendations[user_key?.toString()]
      };
    }, {
      params: t.Object({
        user_key: t.String()
      })
    })
    .get("/recom", async () => {
      const users = await getPrisma().recomTarget.findMany();
      const response: ApiResponse<{ user_key: number; matkul: string }[]> = {
        data: users,
        message: "User list retrieved",
      };
      return response;
    })
    .post("/recom", async ({ body }) => { // simpan input target ke database RecomTarget{user_key, matkuls}
      const { data } = body as any;
      const created = await getPrisma().recomTarget.create({ data });
      return { data: created, message: "User created" };
    })
    .get("/recom/count", async () => {
      const count = await getPrisma().recomTarget.count();
      return { data: { count }, message: "User count retrieved" };
    })
    .post("/score", async ({ body }) => {
      const { data } = body as any;
      const created = await getPrisma().score.create({ data });
      return { data: created, message: "Score created" };
    })
    .post("/score-prompt", async ({ body }) => {
      const { data } = body as any;
      const created = await getPrisma().scorePrompt.create({ data });
      return { data: created, message: "Score prompt created" };
    })
    .put("/score-prompt", async ({ body }) => {
      const { where, data } = body as any;
      const updated = await getPrisma().scorePrompt.update({ where, data });
      return { data: updated, message: "Score prompt updated" };
    })

    // Auth — Verify backend setelah login di frontend 
    .post("/auth/google", async ({ body, jwt }) => {
      const { access_token, user_data } = body;

      // 1. Ambil info user dari Google (Verifikasi Token)
      const resG = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const googleUser: any = await resG.json();

      if (!googleUser.email) throw new Error("Invalid Google Token");

      // 4. Buat JWT Session
      const sessionToken = await jwt.sign({ user_data });

      return {
        success: true,
        token: sessionToken
      };
    }, {
      body: t.Object({
        access_token: t.String(),
        user_data: t.Object({
          name: t.String(),
          email: t.String(),
          picture: t.String()
        })
      })
    })

    // Auth — cek sesi user dari JWT
    .get("/auth/me", async ({ headers, jwt, set }) => {
      const auth = makeAuthMiddleware(jwt);
      const user = await auth({ headers, set });
      if (!user) return { loggedIn: false };
      return { loggedIn: true, user };
    });

  return app;
};