import { useState } from "react";
import { sendChatTfjs } from "../aiChat";
import type { Message } from "@/types";

interface ChatResponse {
    randomResponse: string;
    predictedTag: string;
    probability: number;
}

export const useChatPresenter = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [predictedTag, setPredictedTag] = useState<string | null>(null);

    const saveToChatHistory = (
        userMsg: Message,
        botMsg: Message
    ): void => {
        const existing: Message[] =
            JSON.parse(localStorage.getItem("chat_history") || "[]");

        const updated = [...existing, userMsg, botMsg];

        localStorage.setItem("chat_history", JSON.stringify(updated));
    };

    const sendMessage = async (message: string): Promise<void> => {
        if (!message.trim()) return;

        const startTime = Date.now();

        const userMessage: Message = {
            id: startTime,
            content: message,
            role: "user",
            timestamp: formatTimestamp(startTime),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const response: ChatResponse = await sendChatTfjs(message);

            const duration = Math.round((Date.now() - startTime) / 1000);
            const { predictedTag, probability } = response;

            const timestamp = `${formatTimestamp(Date.now())} (${duration}s, ${predictedTag} [${probability}%])`;

            const botMessage: Message = {
                id: startTime + 1,
                content: response.randomResponse,
                role: "assistant",
                timestamp,
            };

            setPredictedTag(response.predictedTag);
            setMessages((prev) => [...prev, botMessage]);

            saveToChatHistory(userMessage, botMessage);
        } catch (err) {
            console.error("Error sending message:", err);

            const errorMessage: Message = {
                id: Date.now(),
                content: "Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
                role: "assistant",
                timestamp: formatTimestamp(Date.now()),
                isError: true,
            };

            setError(
                "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi."
            );

            setMessages((prev) => [
                ...prev,
                errorMessage,
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        setMessages,
        predictedTag,
        isLoading,
        error,
        sendMessage,
    };
};

// 🔧 format timestamp
const formatTimestamp = (dateValue: number): string => {
    const date = new Date(dateValue);

    const hours = date
        .getHours()
        .toString()
        .padStart(2, "0");

    const minutes = date
        .getMinutes()
        .toString()
        .padStart(2, "0");

    const day = date.getDate();

    const month = date.toLocaleString("default", {
        month: "long",
    });

    return `${hours}:${minutes}, ${day} ${month}`;
};