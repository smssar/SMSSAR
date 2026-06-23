"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { motion } from "framer-motion";

export function ChatWidget({ locale }: { locale: "en" | "ar" | "fr" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  type Message = { from: "user" | "bot"; text: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // expose a global helper to open the chat and prefill text
    const w = window as Window & {
      openSmssarChat?: (prefill?: string) => void;
    };
    w.openSmssarChat = (prefill?: string) => {
      setOpen(true);
      if (prefill) setInput(prefill);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    return () => {
      try {
        delete w.openSmssarChat;
      } catch (err) {
        console.error(err);
      }
    };
  }, []);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const reply = data?.response ?? "Sorry, I couldn't process that.";
      setMessages((m) => [...m, { from: "bot", text: reply }]);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { from: "bot", text: "Network error." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-6 bottom-15 z-50">
      <div className="relative">
        <motion.button
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-label="Open chat"
          onClick={() => setOpen((v) => !v)}
          className="flex h-18 w-18 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          <MessageSquare className="h-6 w-6" />
        </motion.button>

        {open ? (
          <div className="mt-3 w-90 max-w-[calc(100vw-48px)] rounded-xl bg-card/90 p-3 shadow-2xl">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-500" />
                <div className="font-semibold">
                  {locale === "ar"
                    ? "مساعد Smssar"
                    : locale === "fr"
                      ? "Assistant Smssar"
                      : "Smssar Assistant"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  aria-label="close chat"
                  onClick={() => setOpen(false)}
                  className="p-1 cursor-pointer rounded hover:bg-muted/20 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 max-h-64 space-y-3 overflow-auto px-2">
              {messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "مرحبًا! كيف يمكنني مساعدتك اليوم؟"
                    : locale === "fr"
                      ? "Bonjour! Comment puis-je vous aider aujourd'hui?"
                      : "Hello! How can I assist you today?"}
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${m.from === "user" ? "bg-violet-600 text-white" : "bg-muted/40 text-foreground"}`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="mt-3 flex items-center gap-2 px-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center cursor-pointer gap-2 rounded-lg bg-violet-600 px-3 text-white disabled:opacity-80"
              >
                {loading ? "..." : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ChatWidget;
