"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SwarmCursor } from "@/lib/swarm/types";
import { SwarmEngine } from "@/lib/swarm/engine";

interface Props {
  engine: SwarmEngine;
  width: number;
  height: number;
  reducedMotion: boolean;
}

function drawCursor(ctx: CanvasRenderingContext2D, cursor: SwarmCursor, width: number, height: number) {
  const x = cursor.x * width;
  const y = cursor.y * height;
  const color = cursor.identity.color;
  const stateColor = SwarmEngine.stateColor(cursor.state);
  const radius = 7;
  const glow = 12;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glow + radius);
  gradient.addColorStop(0, color + "55");
  gradient.addColorStop(1, color + "00");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, glow + radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -radius - 2);
  ctx.lineTo(radius, 0);
  ctx.lineTo(0, radius + 2);
  ctx.lineTo(-radius, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#050807";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = cursor.state === "idle" ? 0.35 : 0.9;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.font = "600 11px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#E8F5EF";
  ctx.textAlign = "center";
  ctx.fillText(cursor.identity.name, x, y - radius - 12);
  if (cursor.taskLabel || cursor.state !== "idle") {
    ctx.font = "500 10px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = stateColor;
    ctx.fillText(cursor.taskLabel ?? cursor.state, x, y + radius + 16);
  }
}

export function SwarmCanvas({ engine, width, height, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(28, 50, 42, 0.45)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const glow = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.45, Math.max(width, height) * 0.45);
    glow.addColorStop(0, "rgba(0, 230, 118, 0.04)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    engine.getSnapshot().cursors.forEach((cursor) => drawCursor(ctx, cursor, width, height));
  }, [engine, height, width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    draw();
    if (reducedMotion) return;
    const unsubscribe = engine.subscribeFrames(draw);
    return unsubscribe;
  }, [draw, engine, height, reducedMotion, width]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full rounded-xl"
      aria-label="Swarm agent visualization canvas"
      role="img"
    />
  );
}
