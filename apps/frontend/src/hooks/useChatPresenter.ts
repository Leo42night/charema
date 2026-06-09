// src/presenters/chat.ts
import { useState } from "react";
import { formatTimestamp } from "@/lib/utils";
import { sendChatTfjs } from "@/lib/tfjsChat";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";

export const useChatPresenter = () => {
  const user = useAuthStore((state) => state.user); // Ambil data user dari store
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
      const { randomResponse, predictedTag: tag, probability } =
        await sendChatTfjs(message);

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
        timestamp: `${formatTimestamp(Date.now())} (${duration}s, ${tag} [${probability}%])`,
        // Tampilkan button modal hanya kalau tag rekomendasi
        showMatkulModal: tag === "rekomendasi" && !!user, // Pastikan user sudah login untuk rekomendasi
      });

      if (tag !== "unknown") {
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