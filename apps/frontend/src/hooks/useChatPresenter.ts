// src/presenters/chat.ts
import { useState } from "react";
import { formatTimestamp } from "@/lib/utils";
import { sendChatTfjs } from "@/lib/tfjsChat";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { BACKEND_URL } from "@/constants";
import axios from "axios";

// Tipe response biar konsisten antara tfjs & gemini
type ChatResponse = {
  randomResponse: string;
  predictedTag: string;
  probability: number;
  model?: string;
};

type ProviderKey = "gemini" | "groq" | "openrouter" | "z-ai" | "github" | "mistral";

// z-ai gagal membentuk JSON terstruktur (json_schema strict) untuk jawaban akhir,
// TAPI endpoint SQL generator di backend memakai plain-text (callLLMText, bukan json_schema),
// jadi z-ai tetap aman dipakai sebagai sqlProvider — hanya dihindari sebagai answerProvider.
const SQL_MODELS: ProviderKey[] = ["gemini", "groq", "openrouter", "mistral", "z-ai"];
const ANSWER_MODELS: ProviderKey[] = ["gemini", "groq", "openrouter", "mistral"]; // github butuh kartu kredit, z-ai dihindari di sini

// Bangun daftar kombinasi (sqlProvider, answerProvider) yang sudah di-shuffle,
// sehingga tiap percobaan memakai 2 server LLM berbeda (beban tersebar).
function buildProviderPairs(): { sqlProvider: ProviderKey; answerProvider: ProviderKey }[] {
  const sqlPool = shuffleArray([...SQL_MODELS]);
  const answerPool = shuffleArray([...ANSWER_MODELS]);
  const attempts = Math.max(sqlPool.length, answerPool.length);

  const pairs: { sqlProvider: ProviderKey; answerProvider: ProviderKey }[] = [];
  for (let i = 0; i < attempts; i++) {
    const sqlProvider = sqlPool[i % sqlPool.length];
    let answerProvider = answerPool[i % answerPool.length];

    // jangan sampai sqlProvider === answerProvider, biar beban benar-benar
    // tersebar ke 2 server berbeda, bukan numpuk di satu server yang sama
    if (sqlProvider === answerProvider) {
      answerProvider = answerPool[(i + 1) % answerPool.length];
    }
    pairs.push({ sqlProvider, answerProvider });
  }
  return pairs;
}

const tryLLM = async (
  sqlProvider: ProviderKey,
  answerProvider: ProviderKey,
  message: string,
  userId: number,
  userName?: string
): Promise<ChatResponse | null> => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/chat/ask`,
      {
        prompt: message,
        userId,
        sqlProvider,
        answerProvider,
        ...(userName && { userName }),
      },
      { headers: { "Content-Type": "application/json" } }
    );
    if (res.data?.data) {
      return res.data.data as ChatResponse;
    }
    return null;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(`[${sqlProvider}->${answerProvider}]`, err.response?.data);
    }
    return null;
  }
};

const getChatResult = async (
  chatType: string,
  message: string,
  userId: number,
  userName?: string
): Promise<ChatResponse> => {
  if (chatType === "tfjs") {
    return sendChatTfjs(message);
  }

  const pairs = buildProviderPairs();

  for (const { sqlProvider, answerProvider } of pairs) {
    const result = await tryLLM(sqlProvider, answerProvider, message, userId, userName);
    if (result) return { ...result, model: `${sqlProvider}+${answerProvider}` };
  }

  // Semua kombinasi gagal → fallback terakhir ke tfjs
  return sendChatTfjs(message);
};

export const useChatPresenter = () => {
  const user = useAuthStore((state) => state.user); // Ambil data user dari store
  const chatType = useChatStore((s) => s.chatType);
  const setMessages = useChatStore((s) => s.setMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const unlockTag = useChatStore((s) => s.unlockTag);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const startTime = Date.now();

    appendMessage({
      id: startTime,
      content: message,
      role: "user",
      timestamp: formatTimestamp(startTime),
    });

    setIsLoading(true);
    setError(null);

    try {
      let chatResult: ChatResponse;
      if (user?.user_key) {
        chatResult = await getChatResult(chatType, message, user.user_key, Math.random() < 0.5 ? user?.name : undefined);
      } else {
        chatResult = await sendChatTfjs(message);
      }

      const { randomResponse, predictedTag: tag, probability, model } = chatResult;

      const duration = Math.round((Date.now() - startTime) / 1000);

      // 1. Deklarasikan variabel penampung di luar block scope
      let botResponse = "";

      // 2. Berikan nilai berdasarkan kondisi status login dan tag
      if (!user && tag === "rekomendasi") {
        // Catatan: Saya mengubah 'user' menjadi '!user' (jika TIDAK login) sesuai logika teks Anda
        botResponse = "Silakan login untuk mendapatkan rekomendasi matkul yang dipersonalisasi.";
      } else if (user && tag === "rekomendasi") {
        botResponse = randomResponse.replace("<username>", user.given_name); // Contoh personalisasi dengan nama user
      } else {
        botResponse = randomResponse;
      }

      appendMessage({
        id: Date.now(),
        content: botResponse,
        role: "assistant",
        tag: tag,
        timestamp: `${model ? model : 'tfjs'} | ${formatTimestamp(Date.now())} (${duration}s, ${tag} [${probability}%])`,
        // Tampilkan button modal hanya kalau tag rekomendasi
        showMatkulModal: tag === "rekomendasi" && !!user, // Pastikan user sudah login untuk rekomendasi
      });

      if (tag && tag !== "unknown") {
        // Jika tag adalah rekomendasi, user_key WAJIB ADA (true)
        // Jika tag BUKAN rekomendasi, user_key bebas (boleh ada, boleh tidak ada).
        if (!(tag === "rekomendasi" && !user?.user_key)) {
          unlockTag(tag);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.");
      appendMessage({
        id: Date.now(),
        content: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
        role: "assistant",
        timestamp: formatTimestamp(Date.now()),
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    setMessages,
    clearMessages,
    isLoading,
    error,
    sendMessage,
  };
};

function shuffleArray<T>(array: T[]): T[] {
  // Membuat salinan array agar tidak mengubah array asli (immutability)
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Memilih indeks acak dari 0 hingga i
    const j = Math.floor(Math.random() * (i + 1));

    // Menukar elemen menggunakan teknik destructuring assignment TypeScript
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
