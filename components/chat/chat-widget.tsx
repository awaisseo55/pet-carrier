"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, MessageCircle, PawPrint, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "pc_chat_messages";
const GREETING_ID = "greeting";
const GREETING: ChatMessage = {
  id: GREETING_ID,
  role: "assistant",
  content:
    "Hi, I'm the Pet Carrier assistant. Ask me about a product, delivery, returns, or anything else about the shop and I'll do my best to help.",
};

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [GREETING];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [GREETING];
  } catch {
    return [GREETING];
  }
}

/** Renders `[text](/path)` markdown-style links as real clickable Links, plain text otherwise. */
function renderMessageContent(content: string, keyPrefix: string): React.ReactNode[] {
  const linkPattern = /\[([^\]]+)\]\((\/[^\s)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = linkPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }
    nodes.push(
      <Link key={`${keyPrefix}-link-${i++}`} href={match[2]} className="font-medium text-blue-700 underline hover:text-blue-800">
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) nodes.push(content.slice(lastIndex));
  return nodes;
}

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // One-off hydration from sessionStorage on mount, browser storage isn't
    // available during SSR so this can't be a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(loadStoredMessages());
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  React.useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.id !== GREETING_ID)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const replyText: string =
        data.reply || "Sorry, I didn't quite catch that. Could you try asking again, or reach us at hello@pet-carrier.co.uk?";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: replyText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong sending that. Please try again, or reach us at hello@pet-carrier.co.uk.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 hover:bg-coral-600 cursor-pointer sm:bottom-6 sm:right-6",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <MessageCircle className="size-6" />
      </button>

      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-[min(600px,calc(100vh-3rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-all duration-200 sm:bottom-6 sm:right-6",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 bg-blue-700 px-4 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <PawPrint className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">Pet Carrier Chat</p>
              <p className="text-xs text-blue-100">Usually replies in a few seconds</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="flex size-7 items-center justify-center rounded-full text-blue-100 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4">
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-border bg-white text-ink shadow-sm"
                  )}
                >
                  {renderMessageContent(m.content, m.id)}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-gray-400 shadow-sm">
                  <Loader2 className="size-3.5 animate-spin" />
                  Typing...
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border bg-white p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={sending}
            className="h-10 flex-1 rounded-full border border-input bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button type="submit" size="icon" variant="default" disabled={sending || !input.trim()} className="rounded-full">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
