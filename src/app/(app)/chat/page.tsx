import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="ambient-glow flex h-[calc(100dvh-3.5rem-3.5rem)] flex-col md:h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-[var(--border-subtle)] px-4 pb-2 pt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">AI Command Center</p>
        <p className="text-xs text-[var(--text-tertiary)]">Authenticated · Convex persistence enabled</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col"><ChatInterface /></div>
    </div>
  );
}
