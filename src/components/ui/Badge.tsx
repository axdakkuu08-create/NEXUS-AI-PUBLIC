import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "cyan"
  | "muted";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}

const tones: Record<Tone, string> = {
  default: "bg-white/8 text-foreground/90 border-white/10",
  accent: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  danger: "bg-red-500/15 text-red-300 border-red-500/25",
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  muted: "bg-white/5 text-muted border-white/8",
};

export function Badge({
  children,
  tone = "default",
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "success" && "bg-emerald-400",
            tone === "warning" && "bg-amber-400",
            tone === "danger" && "bg-red-400",
            tone === "cyan" && "bg-cyan-400",
            tone === "accent" && "bg-indigo-400",
            (tone === "default" || tone === "muted") && "bg-white/40"
          )}
        />
      )}
      {children}
    </span>
  );
}
