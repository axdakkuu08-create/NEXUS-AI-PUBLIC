import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  size?: "sm" | "md";
}

export function Progress({
  value,
  className,
  barClassName,
  size = "sm",
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-white/8",
        size === "sm" ? "h-1.5" : "h-2",
        className
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500",
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
