import Elysia, { t } from "elysia";
import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import { Mistral } from '@mistralai/mistralai';

// Inisialisasi SDK Gemini (Otomatis membaca proses.env.GEMINI_API_KEY)
const googleAI = new GoogleGenAI({});

// Inisialisasi SDK resmi OpenAI yang diarahkan ke Server Groq
const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1", // Base URL resmi Groq
});

// Inisialisasi SDK OpenAI dengan konfigurasi khusus OpenRouter
const openRouterClient = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1" // URL Endpoint resmi OpenRouter
});

// Inisialisasi SDK resmi Mistral AI (Otomatis membaca process.env.MISTRAL_API_KEY)
const mistralClient = new Mistral();

const zAIClient = new OpenAI({
    apiKey: process.env.Z_AI_API_KEY,
    baseURL: "https://api.z.ai/api/paas/v4"
});
const githubAiClient = new OpenAI({
    apiKey: process.env.GITHUB_TOKEN,
    baseURL: "https://models.github.ai/inference"
});

const predTags = (process.env.PREDICTION_TAGS || "").split(",");

function getInstruction(userName: any) {
    return `Kamu adalah asisten akademik untuk mahasiswa. Tugasmu:
        1. Klasifikasikan maksud (intent) pesan user ke salah satu tag dari predictedTag.
        2. Berikan jawaban natural dalam Bahasa Indonesia sesuai maksud tersebut.
        3. Berikan skor keyakinan (0-100) terhadap klasifikasi tag itu.
        ${userName ? `4. Selipkan nama panggilan dari ${userName} (cukup 1 kata) secara natural di dalam percakapan (bisa di awal, tengah kalimat, atau sebagai penutup), jangan terlalu kaku.` : ''}

        Tag "rekomendasi" HANYA dipakai jika user secara eksplisit meminta saran/rekomendasi mata kuliah untuk diambil. Tag "rekomendasi" responnya adalah meminta mahasiswa klik tombol "pilih mata kuliah" di bawah untuk memilih matkul.`;
}

interface LLMChatParams {
    client: OpenAI;
    model: string;
    prompt: string;
    userName?: string;
    providerName: string;
}

// Definisikan skema validasi body agar tidak diulang-ulang
const chatBodySchema = {
    body: t.Object({
        prompt: t.String({ minLength: 1 }),
        userName: t.Optional(t.String())
    })
};

const executeLLMChat = async ({ client, model, prompt, userName, providerName }: LLMChatParams) => {
    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: getInstruction(userName) },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "academic_classifier",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            predictedTag: {
                                type: "string",
                                enum: predTags,
                            },
                            randomResponse: { type: "string" },
                            probability: { type: "number", description: "Wajib diisi dengan angka skor keyakinan dari skala 0 sampai 100." },
                        },
                        required: ["predictedTag", "randomResponse", "probability"],
                        additionalProperties: false
                    }
                }
            }
        });

        // 1. Ambil konten mentah dari LLM
        let jsonString = response.choices?.[0]?.message?.content || '{}';
        let result;

        try {
            // 2. Bersihkan blok kode markdown jika ada
            if (jsonString.includes('```')) {
                jsonString = jsonString.replace(/```json|```/g, '').trim();
            }

            // 3. Cari batas objek JSON asli untuk memaksimalkan peluang parse sukses
            const firstBraceIndex = jsonString.indexOf('{');
            const lastBraceIndex = jsonString.lastIndexOf('}');

            if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
                jsonString = jsonString.substring(firstBraceIndex, lastBraceIndex + 1);
            }

            // Coba lakukan parse normal
            result = JSON.parse(jsonString);
        } catch (parseError) {
            // JIKA GAGAL: Langsung ambil nilai mentah teks sebagai message, tag "", probability 0
            console.warn(`[${providerName}] Gagal parse JSON. Menggunakan mode fallback langsung.`);

            result = {
                predictedTag: "",
                randomResponse: response.choices?.[0]?.message?.content || jsonString,
                probability: 0
            };
        }

        return {
            success: true,
            data: result,
        };
    } catch (error: any) {
        // Melempar error agar ditangkap oleh blok catch di dalam rute Elysia
        throw new Error(error.message || `Terjadi kesalahan pada server ${providerName}`);
    }
};

export const chatRoutes = () =>
    new Elysia({ prefix: "/chat" })
        .post('/gemini', async ({ body, set }) => {
            try {
                const { prompt, userName } = body;

                const response = await googleAI.models.generateContent({
                    model: 'gemini-3.5-flash',
                    contents: prompt,
                    config: {
                        systemInstruction: getInstruction(userName),
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "object",
                            properties: {
                                predictedTag: {
                                    type: "string",
                                    enum: predTags,
                                },
                                randomResponse: { type: "string" },
                                probability: { type: "number" },
                            },
                            required: ["predictedTag", "randomResponse", "probability"],
                        },
                    },
                });

                const result = JSON.parse(response.text!);

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    error: error.message || 'Terjadi kesalahan pada server',
                };
            }
        }, {
            body: t.Object({
                prompt: t.String({ minLength: 1 }),
                userName: t.Optional(t.String())
            })
        })
        .post('/groq', async ({ body, set }) => {
            try {
                return await executeLLMChat({
                    client: groqClient,
                    model: "openai/gpt-oss-20b",
                    prompt: body.prompt,
                    userName: body.userName,
                    providerName: "Groq"
                });
            } catch (error: any) {
                set.status = 500;
                return { success: false, error: error.message };
            }
        }, chatBodySchema)

        .post('/openrouter', async ({ body, set }) => {
            try {
                return await executeLLMChat({
                    client: openRouterClient,
                    model: "google/gemma-4-26b-a4b-it:free",
                    prompt: body.prompt,
                    userName: body.userName,
                    providerName: "Open Router"
                });
            } catch (error: any) {
                set.status = 500;
                return { success: false, error: error.message };
            }
        }, chatBodySchema)
        .post('/z-ai', async ({ body, set }) => {
            try {
                return await executeLLMChat({
                    client: zAIClient,
                    model: "glm-4.7-flash",
                    prompt: body.prompt,
                    userName: body.userName,
                    providerName: "Z.AI"
                });
            } catch (error: any) {
                set.status = 500;
                return { success: false, error: error.message };
            }
        }, chatBodySchema)
        .post('/github', async ({ body, set }) => {
            try {
                return await executeLLMChat({
                    client: githubAiClient,
                    model: "openai/gpt-4o",
                    prompt: body.prompt,
                    userName: body.userName,
                    providerName: "Github Models"
                });
            } catch (error: any) {
                set.status = 500;
                return { success: false, error: error.message };
            }
        }, chatBodySchema)
        .post('/mistral', async ({ body, set }) => {
            try {
                const { prompt, userName } = body;

                // Menggunakan model 'mistral-large-latest' (atau 'pixtral-large-latest' / 'open-mistral-nemo')
                const response = await mistralClient.chat.complete({
                    model: 'mistral-large-latest', // Large 3, Codestral, and Devstral
                    messages: [
                        { role: 'system', content: getInstruction(userName) },
                        { role: 'user', content: prompt }
                    ],
                    responseFormat: {
                        type: "json_schema",
                        jsonSchema: {
                            name: "academic_classifier",
                            strict: true,
                            schemaDefinition: {
                                type: "object",
                                properties: {
                                    predictedTag: {
                                        type: "string",
                                        enum: predTags,
                                    },
                                    randomResponse: { type: "string" },
                                    probability: { type: "number" },
                                },
                                required: ["predictedTag", "randomResponse", "probability"],
                                additionalProperties: false // Wajib bernilai false jika strict: true
                            }
                        }
                    }
                });

                // Gunakan as string di ujung penugasan variabel
                const jsonString = (response.choices?.[0]?.message?.content || '{}') as string;

                // Proses parsing berjalan normal tanpa komplain dari TypeScript
                const result = JSON.parse(jsonString);

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    error: error.message || 'Terjadi kesalahan pada server Open Router',
                };
            }
        }, {
            body: t.Object({
                prompt: t.String({ minLength: 1 }),
                userName: t.Optional(t.String())
            })
        });