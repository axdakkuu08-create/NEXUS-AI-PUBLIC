"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/cn";

export function ChatInput({
  onSend, onStop, disabled, streaming, placeholder = "Message NEXUS…",
}: {
  onSend?: (text: string) => void | Promise<void>;
  onStop?: () => void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    void onSend?.(text);
    setValue("");
  };
  return (
    <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 safe-bottom">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] focus-within:border-[var(--accent)]/50 transition-colors">
          <textarea
            rows={1} value={value} disabled={disabled} placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            className={cn("w-full resize-none bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:text-[var(--text-tertiary)] max-h-32")}
          />
        </div>
        {streaming ? (
          <Button size="icon" variant="secondary" onClick={onStop} aria-label="Stop">
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button size="icon" variant="primary" onClick={submit} disabled={disabled || !value.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
