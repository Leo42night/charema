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

const tryLLM = async (
  model: string,
  message: string,
  userName?: string
): Promise<ChatResponse | null> => {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/chat/${model}`,
      { prompt: message, ...(userName && { userName }) },
      { headers: { "Content-Type": "application/json" } }
    );
    if (res.data?.data) {
      return res.data.data as ChatResponse;
    }
    return null;
  } catch (err) {
    if (axios.isAxiosError(err)) console.error(`[${model}]`, err.response?.data);
    return null;
  }
};

const getChatResult = async (
  chatType: string,
  message: string,
  userName?: string
): Promise<ChatResponse> => {
  if (chatType === "tfjs") {
    return sendChatTfjs(message);
  }

  // Urutan coba: model pilihan user dulu, baru sisanya, baru tfjs sebagai last resort
  const allLLMs = shuffleArray(["mistral", "groq", "openrouter", "github", "gemini", "z-ai"]); // Best to worst: mistral -> groq -> openrouter -> github -> gemini (ada limit) -> z-ai

  for (const model of allLLMs) {
    const result = await tryLLM(model, message, userName);
    if (result) return { ...result, model };
  }

  // Semua LLM gagal → fallback terakhir ke tfjs
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
      const chatResult: ChatResponse = await getChatResult(chatType, message, Math.random() < 0.5 ? user?.name : undefined);

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
