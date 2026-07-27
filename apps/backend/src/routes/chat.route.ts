import Elysia, { t } from "elysia";
import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import { Mistral } from '@mistralai/mistralai';
import type { DbClient } from "../types";

// PRISMA (raw SQL, dialect-aware: sqlite | postgres)
const DB_TYPE = ((process.env.NODE_ENV || "dev") === "production") ? "postgres" : "sqlite";

// LLM CLIENTS (sama seperti sebelumnya)
const googleAI = new GoogleGenAI({});

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const openRouterClient = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const mistralClient = new Mistral();

const zAIClient = new OpenAI({
    apiKey: process.env.Z_AI_API_KEY,
    baseURL: "https://api.z.ai/api/paas/v4",
});

const githubAiClient = new OpenAI({
    apiKey: process.env.GITHUB_TOKEN,
    baseURL: "https://models.github.ai/inference",
});

const predTags = (process.env.PREDICTION_TAGS || "").split(",");

// PROVIDER REGISTRY
// Frontend memilih random 2 provider (sqlProvider & answerProvider)
// dari daftar ini supaya beban tidak numpuk di satu server model.
type ProviderKey = "gemini" | "groq" | "openrouter" | "z-ai" | "github" | "mistral";
const PROVIDER_KEYS: ProviderKey[] = ["gemini", "groq", "openrouter", "z-ai", "github", "mistral"];

const PROVIDERS: Record<ProviderKey, { model: string; kind: "openai" | "gemini" | "mistral" }> = {
    gemini: { model: "gemini-3.1-flash-lite", kind: "gemini" },
    groq: { model: "openai/gpt-oss-20b", kind: "openai" },
    openrouter: { model: "google/gemma-4-26b-a4b-it:free", kind: "openai" },
    "z-ai": { model: "glm-4.7-flash", kind: "openai" },
    github: { model: "openai/gpt-4o-mini", kind: "openai" },
    mistral: { model: "mistral-large-latest", kind: "mistral" },
};

function getOpenAIClient(key: ProviderKey): OpenAI {
    switch (key) {
        case "groq": return groqClient;
        case "openrouter": return openRouterClient;
        case "z-ai": return zAIClient;
        case "github": return githubAiClient;
        default: throw new Error(`${key} bukan provider bertipe OpenAI-compatible`);
    }
}

function pickRandomProvider(exclude?: ProviderKey): ProviderKey {
    const pool = exclude ? PROVIDER_KEYS.filter(p => p !== exclude) : PROVIDER_KEYS;
    return pool[Math.floor(Math.random() * pool.length)]!;
}

// INSTRUKSI SISTEM (classifier akhir)
function getInstruction(userName?: string) {
    return `Kamu adalah asisten akademik untuk mahasiswa. Tugasmu:
        1. Klasifikasikan maksud (intent) pesan user ke salah satu tag dari predictedTag.
        2. Berikan jawaban natural dalam Bahasa Indonesia sesuai maksud tersebut, dan JIKA disediakan "Data hasil query" di bawah, gunakan data tersebut sebagai dasar jawaban (jangan mengarang angka/nama yang tidak ada di data).
        3. Berikan skor keyakinan (0-100) terhadap klasifikasi tag itu.
        ${userName ? `4. Selipkan nama panggilan dari ${userName} (cukup 1 kata) secara natural di dalam percakapan (bisa di awal, tengah kalimat, atau sebagai penutup), jangan terlalu kaku.` : ''}

        Tag "rekomendasi" HANYA dipakai jika user secara eksplisit meminta saran/rekomendasi mata kuliah untuk diambil. Tag "rekomendasi" responnya adalah meminta mahasiswa klik tombol "pilih mata kuliah" di bawah untuk memilih matkul, namun kamu boleh menyebutkan 2-3 nama matkul teratas dari "Data hasil query" sebagai bocoran singkat jika tersedia.

        Aplikasi ini dibuat oleh Leo Prangs Tobing, Mahasiswa Sistem Informasi UNTAN Angkatan 2022.
        `;
}

function academicClassifierSchema() {
    return {
        type: "object",
        properties: {
            predictedTag: { type: "string", enum: predTags },
            randomResponse: { type: "string" },
            probability: { type: "number", description: "Wajib diisi dengan angka skor keyakinan dari skala 0 sampai 100." },
        },
        required: ["predictedTag", "randomResponse", "probability"],
        additionalProperties: false,
    } as const;
}

function parseJsonSafely(raw: string) {
    let jsonString = raw || "{}";
    try {
        if (jsonString.includes('```')) {
            jsonString = jsonString.replace(/```json|```/g, '').trim();
        }
        const firstBraceIndex = jsonString.indexOf('{');
        const lastBraceIndex = jsonString.lastIndexOf('}');
        if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
            jsonString = jsonString.substring(firstBraceIndex, lastBraceIndex + 1);
        }
        return JSON.parse(jsonString);
    } catch {
        return { predictedTag: "", randomResponse: raw, probability: 0 };
    }
}

// LLM DISPATCHER — TEXT MODE (dipakai untuk generate SQL)
async function callLLMText(providerKey: ProviderKey, systemPrompt: string, userPrompt: string): Promise<string> {
    const provider = PROVIDERS[providerKey];

    if (provider.kind === "gemini") {
        const response = await googleAI.models.generateContent({
            model: provider.model,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt },
        });
        return (response.text ?? "").trim();
    }

    if (provider.kind === "mistral") {
        const response = await mistralClient.chat.complete({
            model: provider.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });
        return (((response.choices?.[0]?.message?.content as string) || "")).trim();
    }

    // kind === "openai" (groq, openrouter, z-ai, github)
    const client = getOpenAIClient(providerKey);
    const response = await client.chat.completions.create({
        model: provider.model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });
    return (response.choices?.[0]?.message?.content || "").trim();
}

// LLM DISPATCHER — JSON MODE (dipakai untuk jawaban akhir/classifier)
async function callLLMJson(providerKey: ProviderKey, systemPrompt: string, userPrompt: string): Promise<any> {
    const provider = PROVIDERS[providerKey];
    const schema = academicClassifierSchema();

    if (provider.kind === "gemini") {
        const response = await googleAI.models.generateContent({
            model: provider.model,
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: schema as any,
            },
        });
        return parseJsonSafely(response.text ?? "{}");
    }

    if (provider.kind === "mistral") {
        const response = await mistralClient.chat.complete({
            model: provider.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            responseFormat: {
                type: "json_schema",
                jsonSchema: {
                    name: "academic_classifier",
                    strict: true,
                    schemaDefinition: schema as any,
                },
            },
        });
        return parseJsonSafely((response.choices?.[0]?.message?.content as string) || "{}");
    }

    // kind === "openai"
    const client = getOpenAIClient(providerKey);
    const response = await client.chat.completions.create({
        model: provider.model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "academic_classifier",
                strict: true,
                schema: schema as any,
            },
        },
    });
    return parseJsonSafely(response.choices?.[0]?.message?.content || "{}");
}

// SKEMA DB + ATURAN DIALECT (SQLite vs Postgres)
const DB_SCHEMA = `
Tabel yang tersedia (READ-ONLY):
users(user_id, name)
matkul(matkul_id, matkul, kode_matkul, sks)
dosen(dosen_id, dosen)
prodi(prodi_id, prodi)
transaksi(id, user_id, matkul_id, prodi_id, kelas, rating, tahun, sm, smt, matkul_lower, kelompok_minat, category, rate)
transaksi_dosen(transaksi_id, dosen_id)

Relasi: transaksi.user_id -> users.user_id, transaksi.matkul_id -> matkul.matkul_id,
transaksi.prodi_id -> prodi.prodi_id, transaksi_dosen menghubungkan transaksi <-> dosen (many-to-many).
`;

function dialectRules(): string {
    if (DB_TYPE === "postgres") {
        return `
Dialect: PostgreSQL.
- Gunakan ILIKE untuk pencarian teks case-insensitive.
- Gunakan LIMIT n untuk membatasi baris.
- Fungsi acak: RANDOM().`;
    }
    return `
Dialect: SQLite.
- Gunakan LOWER(kolom) LIKE LOWER('%...%') untuk pencarian teks case-insensitive.
- Gunakan LIMIT n untuk membatasi baris.
- Fungsi acak: RANDOM().`;
}

// GUARD RAIL: sanitasi SQL hasil generate LLM
const FORBIDDEN_SQL = /\b(insert|update|delete|drop|alter|attach|detach|create|replace|grant|revoke|truncate|vacuum|pragma|exec|execute|into\s+outfile)\b/i;

class SqlRejectedError extends Error { }

function sanitizeGeneratedSql(rawSql: string, userId: number): string {
    let sql = rawSql.trim();
    sql = sql.replace(/```sql|```/gi, "").trim();

    // ambil hanya statement pertama (cegah stacked queries)
    sql = sql.split(";")[0]!.trim();

    if (!sql || /^none$/i.test(sql)) {
        throw new SqlRejectedError("NONE");
    }
    if (!/^select/i.test(sql)) {
        throw new Error("Query yang dihasilkan bukan statement SELECT.");
    }
    if (FORBIDDEN_SQL.test(sql)) {
        throw new Error("Query mengandung operasi yang tidak diizinkan.");
    }

    // Guard privasi: jika query menyentuh tabel transaksi (data personal),
    // wajib memfilter user_id milik pemanggil. Ini best-effort di level
    // aplikasi. idealnya tetap dikombinasikan dengan role DB read-only
    // + row-level security di database untuk pertahanan berlapis.
    const touchesTransaksi = /\btransaksi\b/i.test(sql);
    const hasUserFilter = new RegExp(`user_id\\s*=\\s*${userId}\\b`).test(sql);
    if (touchesTransaksi && !hasUserFilter) {
        throw new Error("Query menyentuh data transaksi tapi tidak memfilter user_id pemanggil.");
    }

    if (!/limit\s+\d+/i.test(sql)) {
        sql += " LIMIT 50";
    }
    return sql;
}

async function fetchDistinctKelompokMinat(getPrisma: () => DbClient): Promise<string[]> {
    const rows = await getPrisma().$queryRawUnsafe<{ kelompok_minat: string }[]>(
        `SELECT DISTINCT kelompok_minat FROM transaksi WHERE kelompok_minat IS NOT NULL LIMIT 100`
    );
    return rows.map(r => r.kelompok_minat).filter(Boolean);
}

// TAHAP 1: TEXT-TO-SQL (grounding faktual/agregat)
async function generateSql(params: {
    providerKey: ProviderKey;
    question: string;
    userId: number;
    kelompokMinatOptions: string[];
}): Promise<string> {
    const { providerKey, question, userId, kelompokMinatOptions } = params;

    const systemPrompt = `Kamu adalah generator SQL untuk asisten akademik mahasiswa.
${DB_SCHEMA}
${dialectRules()}

Daftar nilai kelompok_minat yang benar-benar ada di database (gunakan untuk mencocokkan minat user
secara SEMANTIK meskipun penulisan user berbeda, mis. "AI" -> "Kecerdasan Buatan"):
${kelompokMinatOptions.length ? kelompokMinatOptions.map(k => `- ${k}`).join("\n") : "(tidak ada data)"}

Aturan WAJIB:
1. Hanya boleh menghasilkan SATU statement SELECT. Tidak boleh INSERT/UPDATE/DELETE/DDL apapun.
2. Jika query menyentuh tabel transaksi, WAJIB tambahkan kondisi "user_id = ${userId}" di WHERE,
   KECUALI untuk sub-query pembanding umum yang tetap harus tetap ada literal "user_id = ${userId}" di klausa utama.
3. Jika pertanyaan adalah permintaan REKOMENDASI matkul:
   - Cari kelompok_minat yang paling relevan secara makna dari daftar di atas (boleh lebih dari satu).
   - Kecualikan matkul yang sudah pernah diambil user (cek EXISTS/NOT IN ke transaksi WHERE user_id = ${userId}).
   - Urutkan berdasarkan AVG(rating) tertinggi, lalu jumlah pengambil (popularitas), gunakan GROUP BY matkul.
4. Batasi hasil dengan LIMIT (default 10, atau sesuai konteks pertanyaan).
5. Jika pertanyaan TIDAK memerlukan data dari database (mis. sapaan, basa-basi, pertanyaan umum
   yang tidak menyangkut data akademik), balas HANYA dengan teks: NONE
6. Balas HANYA dengan query SQL mentah (atau NONE). Tanpa penjelasan, tanpa markdown, tanpa titik koma di akhir.`;

    return callLLMText(providerKey, systemPrompt, question);
}

// TAHAP 2: EKSEKUSI SQL (Prisma raw, dialect-aware)
async function executeSql(getPrisma: () => DbClient, sql: string): Promise<any[]> {
    return getPrisma().$queryRawUnsafe<any[]>(sql);
}

// TAHAP 3: JAWABAN AKHIR (grounded pada hasil SQL)
async function generateAnswer(params: {
    providerKey: ProviderKey;
    question: string;
    userName?: string;
    rows: any[];
    sqlUsed: string | null;
}) {
    const { providerKey, question, userName, rows, sqlUsed } = params;
    const systemPrompt = getInstruction(userName);
    const userPrompt = sqlUsed
        ? `Pertanyaan mahasiswa: ${question}\n\nData hasil query (grounding, JANGAN mengarang di luar ini):\n${JSON.stringify(rows).slice(0, 6000)}`
        : `Pertanyaan mahasiswa: ${question}\n\n(Tidak ada data DB yang relevan untuk pertanyaan ini.)`;

    return callLLMJson(providerKey, systemPrompt, userPrompt);
}

// ROUTES
const chatBodySchema = {
    body: t.Object({
        prompt: t.String({ minLength: 1 }),
        userName: t.Optional(t.String()),
    }),
};

const askBodySchema = {
    body: t.Object({
        prompt: t.String({ minLength: 1 }),
        userId: t.Number(),
        userName: t.Optional(t.String()),
        // Dipilih random oleh frontend agar beban tersebar ke server LLM berbeda.
        sqlProvider: t.Optional(t.Union(PROVIDER_KEYS.map(k => t.Literal(k)) as any)),
        answerProvider: t.Optional(t.Union(PROVIDER_KEYS.map(k => t.Literal(k)) as any)),
    }),
};

export const chatRoutes = (getPrisma: () => DbClient) =>
    new Elysia({ prefix: "/chat" })
        .guard({
            beforeHandle: ({ request, set }) => {
                const url = new URL(request.url);
                if (request.method === "OPTIONS") return;

                const origin = request.headers.get("origin");
                const frontendUrlsRaw = process.env.FRONTEND_URLS || "http://localhost:5173,http://localhost:4173";
                if (frontendUrlsRaw) {
                    const allowedOrigins: string[] = frontendUrlsRaw.split(",");
                    if (allowedOrigins.includes(origin ?? '')) {
                        return;
                    }
                }

                const key = url.searchParams.get("key");
                const apiKey = process.env.API_KEY!;
                if (key !== apiKey) {
                    set.status = 401;
                    return { message: "Unauthorized: Access denied without valid API Key" };
                }
            }
        }, (app) =>
            app
                // Daftar provider yang tersedia. dipakai frontend untuk
                // memilih random sqlProvider & answerProvider.
                .get('/providers', () => ({
                    success: true,
                    data: PROVIDER_KEYS,
                }))

                // ENDPOINT UTAMA: Hybrid RAG
                // (Text-to-SQL grounding + semantic kelompok_minat matching
                //  via LLM + jawaban akhir grounded)
                .post('/ask', async ({ body, set }) => {
                    const { prompt, userId, userName, sqlProvider, answerProvider } = body as {
                        prompt: string; userId: number; userName?: string;
                        sqlProvider?: ProviderKey; answerProvider?: ProviderKey;
                    };

                    const chosenSqlProvider = sqlProvider ?? pickRandomProvider();
                    const chosenAnswerProvider = answerProvider ?? pickRandomProvider(chosenSqlProvider);

                    let sql: string | null = null;
                    let rows: any[] = [];

                    try {
                        const kelompokMinatOptions = await fetchDistinctKelompokMinat(getPrisma);

                        const rawSql = await generateSql({
                            providerKey: chosenSqlProvider,
                            question: prompt,
                            userId,
                            kelompokMinatOptions,
                        });

                        try {
                            sql = sanitizeGeneratedSql(rawSql, userId);
                            rows = await executeSql(getPrisma, sql);
                        } catch (err) {
                            if (!(err instanceof SqlRejectedError)) {
                                // Query ditolak guard rail -> lanjut tanpa grounding data
                                // (bukan fatal, biar chat tetap jalan tanpa data DB).
                                console.warn(`[ask] SQL ditolak: ${(err as Error).message} | raw: ${rawSql}`);
                            }
                            sql = null;
                            rows = [];
                        }

                        const answer = await generateAnswer({
                            providerKey: chosenAnswerProvider,
                            question: prompt,
                            userName,
                            rows,
                            sqlUsed: sql,
                        });

                        return {
                            success: true,
                            data: answer,
                            meta: {
                                sqlProvider: chosenSqlProvider,
                                answerProvider: chosenAnswerProvider,
                                generatedSql: sql,
                                rowCount: rows.length,
                            },
                        };
                    } catch (error: any) {
                        set.status = 500;
                        return {
                            success: false,
                            error: error.message || "Terjadi kesalahan pada pipeline RAG",
                        };
                    }
                }, askBodySchema)

                // Endpoint per-provider lama tetap dipertahankan (kompatibilitas
                // mundur / dipakai untuk kasus di luar alur RAG penuh).
                .post('/gemini', async ({ body, set }) => {
                    try {
                        const data = await callLLMJson("gemini", getInstruction(body.userName), body.prompt);
                        return { success: true, data };
                    } catch (error: any) {
                        set.status = 500;
                        return { success: false, error: error.message || 'Terjadi kesalahan pada server' };
                    }
                }, chatBodySchema)
                .post('/groq', async ({ body, set }) => {
                    try {
                        const data = await callLLMJson("groq", getInstruction(body.userName), body.prompt);
                        return { success: true, data };
                    } catch (error: any) {
                        set.status = 500;
                        return { success: false, error: error.message };
                    }
                }, chatBodySchema)
                .post('/openrouter', async ({ body, set }) => {
                    try {
                        const data = await callLLMJson("openrouter", getInstruction(body.userName), body.prompt);
                        return { success: true, data };
                    } catch (error: any) {
                        set.status = 500;
                        return { success: false, error: error.message };
                    }
                }, chatBodySchema)
                .post('/z-ai', async ({ body, set }) => {
                    try {
                        const data = await callLLMJson("z-ai", getInstruction(body.userName), body.prompt);
                        return { success: true, data };
                    } catch (error: any) {
                        set.status = 500;
                        return { success: false, error: error.message };
                    }
                }, chatBodySchema)
                .post('/github', async ({ body, set }) => {
                    try {
                        const data = await callLLMJson("github", getInstruction(body.userName), body.prompt);
                        return { success: true, data };
                    } catch (error: any) {
                        set.status = 500;
                        return { success: false, error: error.message };
                    }
                }, chatBodySchema)
                .post('/mistral', async ({ body, set }) => {
                    try {
                        const data = await callLLMJson("mistral", getInstruction(body.userName), body.prompt);
                        return { success: true, data };
                    } catch (error: any) {
                        set.status = 500;
                        return { success: false, error: error.message || 'Terjadi kesalahan pada server Mistral' };
                    }
                }, chatBodySchema)
        );