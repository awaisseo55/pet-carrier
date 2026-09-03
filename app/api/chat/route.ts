import { NextResponse } from "next/server";
import { buildChatSystemPrompt } from "@/lib/chat-context";
import { getRuleBasedReply } from "@/lib/chat-rules";

// TODO: reuses ANTHROPIC_API_KEY (same as lib/ai-content.ts's Amazon-import
// rewriting). Whenever it's unset, or the Claude call fails for any reason
// (including a billing/credit block), this route falls back to the free
// rule-based responder in lib/chat-rules.ts instead of a dead-end error, so
// the widget is always useful. No code change is needed to "switch on" real
// AI answers later, once ANTHROPIC_API_KEY has working credits behind it the
// Claude call below will simply start succeeding.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-5";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

interface RawChatMessage {
  role?: unknown;
  content?: unknown;
}

export async function POST(request: Request) {
  let body: { messages?: RawChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  if (messages.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const latestUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || messages[messages.length - 1].content;

  if (!ANTHROPIC_API_KEY) {
    const reply = await getRuleBasedReply(latestUserMessage);
    return NextResponse.json({ reply });
  }

  try {
    const system = await buildChatSystemPrompt();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text?.trim();
    if (!reply) throw new Error("Empty response from Claude");

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat widget: Claude call failed, falling back to rule-based reply", error);
    const reply = await getRuleBasedReply(latestUserMessage);
    return NextResponse.json({ reply });
  }
}
