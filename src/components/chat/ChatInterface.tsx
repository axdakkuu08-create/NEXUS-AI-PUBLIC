"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "@/components/states/EmptyState";
import { MessageSquare } from "lucide-react";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);

  const handleSend = (text: string) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);

    // Honest: no backend yet — show a local system note instead of fake AI success
    setStreaming(true);
    setTimeout(() => {
      const note: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "Backend is not connected yet. Conversations will persist after Convex integration (M2). This is a local UI preview only.",
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, note]);
      setStreaming(false);
    }, 600);
  };

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            title="Start a conversation"
            description="Messages will sync with Convex when the backend is connected. Until then, this is a UI preview."
          />
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
      <ChatInput
        onSend={handleSend}
        onStop={() => setStreaming(false)}
        streaming={streaming}
      />
    </div>
  );
}
