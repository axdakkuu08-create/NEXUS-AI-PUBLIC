import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in before sending a message." }, { status: 401 });

  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) {
    return NextResponse.json({ error: "The server-side AI provider is not configured yet." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 256_000) {
    return NextResponse.json({ error: "The conversation request is too large." }, { status: 413 });
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 20) {
    return NextResponse.json({ error: "Send between 1 and 20 recent messages." }, { status: 400 });
  }

  const messages: ChatMessage[] = [];
  for (const item of body.messages) {
    if (
      !item || typeof item !== "object" ||
      !("role" in item) || !("content" in item) ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" || !item.content.trim() || item.content.length > 12000
    ) {
      return NextResponse.json({ error: "A message is invalid or exceeds the allowed size." }, { status: 400 });
    }
    messages.push({ role: item.role, content: item.content.trim() });
  }

  if (!messages.some((message) => message.role === "user")) {
    return NextResponse.json({ error: "At least one user message is required." }, { status: 400 });
  }

  let endpoint: URL;
  try {
    endpoint = new URL(`${baseUrl.replace(/\/+$/, "")}/chat/completions`);
  } catch {
    return NextResponse.json({ error: "The AI provider URL is invalid." }, { status: 503 });
  }
  if (endpoint.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(endpoint.hostname)) {
    return NextResponse.json({ error: "The AI provider must use HTTPS." }, { status: 503 });
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: 1200 }),
      cache: "no-store",
      signal: request.signal,
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "The AI provider rejected the request. Check the server-side provider configuration." },
        { status: 502 },
      );
    }

    const result: unknown = await upstream.json();
    if (!result || typeof result !== "object" || !("choices" in result) || !Array.isArray(result.choices)) {
      return NextResponse.json({ error: "The AI provider returned an unsupported response." }, { status: 502 });
    }
    const first = result.choices[0];
    if (!first || typeof first !== "object" || !("message" in first)) {
      return NextResponse.json({ error: "The AI provider returned no message." }, { status: 502 });
    }
    const assistantMessage = first.message;
    if (
      !assistantMessage || typeof assistantMessage !== "object" ||
      !("content" in assistantMessage) ||
      typeof assistantMessage.content !== "string" || !assistantMessage.content.trim()
    ) {
      return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
    }

    return NextResponse.json(
      { message: assistantMessage.content.trim() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "The AI provider could not be reached." }, { status: 502 });
  }
}
