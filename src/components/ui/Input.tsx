"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, label, id, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-foreground",
          "placeholder:text-muted/70",
          "focus:border-indigo-400/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
          "transition-colors duration-150",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Textarea({
  className,
  label,
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium text-muted"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-foreground",
          "placeholder:text-muted/70 min-h-[80px] resize-y",
          "focus:border-indigo-400/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
          "transition-colors duration-150",
          className
        )}
        {...props}
      />
    </div>
  );
}
