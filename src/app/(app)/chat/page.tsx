import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="ambient-glow h-[calc(100dvh-3.5rem-3.5rem)] md:h-[calc(100dvh-3.5rem)] flex flex-col">
      <div className="px-4 pt-3 pb-1 border-b border-[var(--border-subtle)]">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">AI Command Center</p>
        <p className="text-xs text-[var(--text-tertiary)]">Authenticated chat · private conversation history</p>
      </div>
      <div className="flex-1 min-h-0 flex flex-col"><ChatInterface /></div>
    </div>
  );
}
