import { NextResponse } from "next/server";
import { buildChatSystemPrompt } from "@/lib/chat-context";

// TODO: reuses ANTHROPIC_API_KEY (same as lib/ai-content.ts's Amazon-import
// rewriting), unset by default locally. Without it the widget still works,
// it just returns a canned "chat isn't switched on yet" reply instead of
// calling Claude.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-5";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

const NOT_CONFIGURED_REPLY =
  "Our live chat assistant isn't switched on just yet. Please reach us at hello@pet-carrier.co.uk or via the contact page and we'll get back to you as soon as we can.";
const ERROR_REPLY =
  "Sorry, something went wrong on our end there. Please try again in a moment, or reach us at hello@pet-carrier.co.uk.";

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

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: NOT_CONFIGURED_REPLY });
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
    console.error("Chat widget error", error);
    return NextResponse.json({ reply: ERROR_REPLY });
  }
}
