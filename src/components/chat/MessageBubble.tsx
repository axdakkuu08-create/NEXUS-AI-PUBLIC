import { cn } from "@/lib/cn";
import type { Message } from "@/lib/types";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-[var(--accent)] text-white rounded-br-md"
            : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.streaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-current animate-pulse opacity-70" />
        )}
      </div>
    </div>
  );
}
