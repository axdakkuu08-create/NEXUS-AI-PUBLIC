"use client";

import { useRef, useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { MessageSquarePlus } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EmptyState } from "@/components/states/EmptyState";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { Message } from "@/lib/types";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

function SetupState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center">
        <MessageSquarePlus className="mx-auto h-8 w-8 text-[var(--accent)]" />
        <h2 className="mt-4 text-base font-semibold">Chat setup required</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{message}</p>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Chat will not simulate an AI response or claim to save messages until its services are configured.
        </p>
      </div>
    </div>
  );
}

export function ChatInterface() {
  if (!clerkConfigured) return <SetupState message="Clerk authentication is not configured for this deployment." />;
  if (!convexConfigured) return <SetupState message="The Convex deployment URL is not configured for this deployment." />;
  return <ConnectedChatInterface />;
}

function ConnectedChatInterface() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const conversations = useQuery(api.conversations.list, isAuthenticated ? {} : "skip");
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.messages.add);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [conversationChoiceMade, setConversationChoiceMade] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const activeConversationId = conversationChoiceMade
    ? selectedConversationId
    : conversations?.[0]?._id ?? null;

  const storedMessages = useQuery(
    api.messages.list,
    isAuthenticated && activeConversationId ? { conversationId: activeConversationId } : "skip",
  );

  const handleSend = async (content: string) => {
    if (pending || !isAuthenticated) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = await createConversation({ title: content.slice(0, 80) });
        setSelectedConversationId(conversationId);
        setConversationChoiceMade(true);
      }

      const history = (storedMessages ?? []).slice(-18).map((message) => ({
        role: message.role,
        content: message.content,
      }));
      await addMessage({ conversationId, role: "user", content });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller.signal,
        body: JSON.stringify({ messages: [...history, { role: "user", content }] }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "The AI service could not respond.");
      }
      if (typeof payload.message !== "string" || !payload.message.trim()) {
        throw new Error("The AI provider returned an empty response.");
      }

      await addMessage({ conversationId, role: "assistant", content: payload.message });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") {
        setNotice("Response stopped. Your message remains saved in this conversation.");
      } else {
        setError(cause instanceof Error ? cause.message : "The response could not be completed.");
      }
    } finally {
      controllerRef.current = null;
      setPending(false);
    }
  };

  const handleStop = () => controllerRef.current?.abort();

  if (authLoading) {
    return <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Checking your secure session…</div>;
  }
  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center">
          <h2 className="text-base font-semibold">Sign in to use private chat</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Your conversations are scoped to your account.</p>
          <SignInButton mode="modal">
            <button className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#050807]">
              Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }
  if (conversations === undefined) {
    return <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Loading your conversations…</div>;
  }
  if (activeConversationId && storedMessages === undefined) {
    return <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Loading conversation history…</div>;
  }

  const visibleMessages: Message[] = (storedMessages ?? []).map((message) => ({
    id: String(message._id),
    role: message.role,
    content: message.content,
    createdAt: new Date(message.createdAt).toISOString(),
  }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
        <label className="sr-only" htmlFor="conversation-history">Conversation history</label>
        <select
          id="conversation-history"
          aria-label="Conversation history"
          value={activeConversationId ?? ""}
          onChange={(event) => {
            setConversationChoiceMade(true);
            setSelectedConversationId(event.target.value ? (event.target.value as Id<"conversations">) : null);
          }}
          className="min-w-0 max-w-full flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)]"
          disabled={pending}
        >
          <option value="">New conversation</option>
          {conversations.map((conversation) => (
            <option key={conversation._id} value={conversation._id}>{conversation.title}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setConversationChoiceMade(true);
            setSelectedConversationId(null);
          }}
          disabled={pending}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] disabled:opacity-50"
        >
          New chat
        </button>
      </div>

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-4">
        {visibleMessages.length === 0 ? (
          <EmptyState
            icon={<MessageSquarePlus className="h-6 w-6" />}
            title="Start a conversation"
            description="Messages are stored privately in your Convex account and can be reopened from conversation history."
          />
        ) : visibleMessages.map((message) => <MessageBubble key={message.id} message={message} />)}
        {pending && <p className="text-xs text-[var(--text-tertiary)]" role="status">NEXUS is waiting for the model response…</p>}
        {notice && <p className="text-xs text-[var(--text-secondary)]" role="status">{notice}</p>}
        {error && <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]" role="alert">{error}</p>}
      </div>

      <ChatInput onSend={handleSend} onStop={handleStop} streaming={pending} />
    </div>
  );
}
