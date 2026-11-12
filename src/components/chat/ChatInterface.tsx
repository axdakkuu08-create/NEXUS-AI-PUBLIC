"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "@/components/states/EmptyState";
import { MessageSquare } from "lucide-react";

export function ChatInterface() {
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversations = useQuery(api.conversations.list, {});
  const activeConversationId = conversationId ?? conversations?.[0]?._id ?? null;
  const storedMessages = useQuery(
    api.messages.list,
    activeConversationId ? { conversationId: activeConversationId } : "skip",
  );
  const createConversation = useMutation(api.conversations.create);
  const sendMessage = useMutation(api.messages.send);

  const messages: Message[] = (storedMessages ?? []).map((message) => ({
    id: message._id,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.createdAt).toISOString(),
  }));

  const handleSend = async (content: string) => {
    setSending(true);
    setError(null);
    try {
      let activeConversation = activeConversationId;
      if (!activeConversation) {
        activeConversation = await createConversation({
          title: content.slice(0, 80),
        });
        setConversationId(activeConversation);
      }
      await sendMessage({ conversationId: activeConversation, content });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Message could not be saved.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {storedMessages === undefined ? (
          <p className="text-center text-xs text-[var(--text-tertiary)]">Loading saved conversation…</p>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            title="Start a conversation"
            description="Your messages are saved to your authenticated Convex account and reload with this conversation."
          />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </div>
      <ChatInput
        onSend={handleSend}
        disabled={sending}
        streaming={false}
        placeholder={sending ? "Saving message…" : "Message NEXUS…"}
      />
    </div>
  );
}
