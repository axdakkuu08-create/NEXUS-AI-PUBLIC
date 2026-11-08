"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SwarmEngine } from "@/lib/swarm/engine";
import type { SwarmCursor, SwarmAgentState } from "@/lib/swarm/types";
import { SwarmCanvas } from "./SwarmCanvas";
import { cn } from "@/lib/cn";

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const STATE_LABEL: Record<SwarmAgentState, string> = {
  idle: "Idle",
  working: "Working",
  waiting: "Waiting approval",
  completed: "Completed",
  failed: "Failed",
};

export function SwarmMonitor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<SwarmEngine | null>(null);
  const [cursors, setCursors] = useState<SwarmCursor[]>([]);
  const [size, setSize] = useState({ w: 800, h: 420 });
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, () => false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initialReducedMotion = media.matches;
    const instance = new SwarmEngine({
      agentCount: 5,
      width: size.w,
      height: size.h,
      reducedMotion: initialReducedMotion,
      simulation: true,
    });
    const unsubscribe = instance.subscribe((snapshot) => {
      // The engine is published from its own subscription notification, not the
      // effect body, so this state update follows the external-store pattern.
      setEngine(instance);
      setCursors(snapshot.cursors);
    });
    const onMotionChange = (event: MediaQueryListEvent) => {
      instance.setReducedMotion(event.matches);
    };
    media.addEventListener("change", onMotionChange);
    return () => {
      media.removeEventListener("change", onMotionChange);
      unsubscribe();
      instance.destroy();
    };
    // The engine is created once; size and controls are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({
        w: Math.max(280, Math.floor(entry.contentRect.width)),
        h: Math.max(240, Math.floor(entry.contentRect.height)),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    engine?.resize(size.w, size.h);
  }, [engine, size.h, size.w]);

  useEffect(() => {
    if (!engine) return;
    if (paused || reducedMotion) engine.stop();
    else engine.start();
  }, [engine, paused, reducedMotion]);

  const togglePause = useCallback(() => setPaused((value) => !value), []);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Swarm Workspace</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Original visual agent system ·{" "}
            <span className="text-[var(--warning)]">Demo simulation — not live agent activity</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reducedMotion && (
            <span className="text-xs text-[var(--text-secondary)]">Reduced motion</span>
          )}
          <button
            type="button"
            onClick={togglePause}
            aria-pressed={paused}
            className={cn(
              "h-10 rounded-lg border px-3 text-sm font-medium transition-colors",
              "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]",
              "hover:bg-[var(--bg-hover)]"
            )}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-1 text-[11px] text-[var(--text-secondary)]">
        {(Object.keys(STATE_LABEL) as SwarmAgentState[]).map((state) => (
          <span key={state} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: SwarmEngine.stateColor(state) }} />
            {STATE_LABEL[state]}
          </span>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative min-h-[260px] flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]"
      >
        {engine && (
          <SwarmCanvas
            engine={engine}
            width={size.w}
            height={size.h}
            reducedMotion={reducedMotion}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {cursors.map((cursor) => (
          <div key={cursor.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: cursor.identity.color }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{cursor.identity.name}</div>
              <div className="truncate text-[10px]" style={{ color: SwarmEngine.stateColor(cursor.state) }}>
                {cursor.taskLabel ?? STATE_LABEL[cursor.state]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
