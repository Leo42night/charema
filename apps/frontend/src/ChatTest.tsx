// ganti App.tsx dengan ini untuk test model
import { useState } from "react";
import { sendChatTfjs } from "@/lib/tfjsChat";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function ChatTest() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatTfjs(userMessage.text);

      const botMessage: Message = {
        role: "bot",
        text: res.randomResponse,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Terjadi error pada model.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neo-bg dark:bg-zinc-950">
      {/* Header */}
      <div className="p-3 border-b-4 border-black dark:border-neo-yellow font-bold">
        TFJS Chat Test
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] p-2 border-2 border-black shadow-neo-sm text-sm ${
              msg.role === "user"
                ? "ml-auto bg-neo-yellow"
                : "mr-auto bg-white dark:bg-zinc-800 dark:text-white"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="text-xs opacity-60">Bot sedang mengetik...</div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t-4 border-black dark:border-neo-yellow flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ketik pesan..."
          className="flex-1 border-2 border-black px-2 py-1 text-sm outline-none"
        />

        <button
          onClick={handleSend}
          className="px-3 py-1 border-2 border-black bg-neo-yellow font-bold text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}