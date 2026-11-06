import type {
  SwarmAgentIdentity,
  SwarmAgentState,
  SwarmCursor,
  SwarmEngineConfig,
  SwarmEngineSnapshot,
} from "./types";

const DEFAULT_IDENTITIES: SwarmAgentIdentity[] = [
  { id: "a1", name: "Nexus", color: "#00E676", role: "Orchestrator" },
  { id: "a2", name: "Scout", color: "#40C4FF", role: "Research" },
  { id: "a3", name: "Forge", color: "#FFB300", role: "Builder" },
  { id: "a4", name: "Guard", color: "#FF5252", role: "Validator" },
  { id: "a5", name: "Pulse", color: "#69F0AE", role: "Monitor" },
  { id: "a6", name: "Echo", color: "#B388FF", role: "Synthesizer" },
];

const STATE_COLORS: Record<SwarmAgentState, string> = {
  idle: "#8FAFA0",
  working: "#00E676",
  waiting: "#FFB300",
  completed: "#00E676",
  failed: "#FF5252",
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
const randomIn = (min: number, max: number) => min + Math.random() * (max - min);

export class SwarmEngine {
  private cursors: SwarmCursor[] = [];
  private config: SwarmEngineConfig;
  private frame = 0;
  private lastTs = 0;
  private rafId: number | null = null;
  private listeners = new Set<(snapshot: SwarmEngineSnapshot) => void>();
  private frameListeners = new Set<() => void>();
  private running = false;

  constructor(config: Partial<SwarmEngineConfig> = {}) {
    this.config = {
      agentCount: 5,
      width: 800,
      height: 500,
      reducedMotion: false,
      simulation: true,
      ...config,
    };
    this.seed();
  }

  private seed() {
    const identities = DEFAULT_IDENTITIES.slice(0, this.config.agentCount);
    this.cursors = identities.map((identity, index) => {
      const x = randomIn(0.15, 0.85);
      const y = randomIn(0.2, 0.8);
      return {
        id: identity.id,
        identity,
        state: (["idle", "working", "waiting"] as SwarmAgentState[])[index % 3],
        x, y, targetX: x, targetY: y, vx: 0, vy: 0,
        phase: Math.random() * Math.PI * 2,
        taskLabel: undefined,
        stateChangedAt: performance.now(),
      };
    });
  }

  getSnapshot(): SwarmEngineSnapshot {
    return {
      cursors: this.cursors.map((cursor) => ({ ...cursor })),
      timestamp: performance.now(),
      frame: this.frame,
    };
  }

  subscribe(listener: (snapshot: SwarmEngineSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  /** Canvas subscribers are notified per frame without scheduling React renders. */
  subscribeFrames(listener: () => void) {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  private emitState() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private emitFrame() {
    this.frameListeners.forEach((listener) => listener());
  }

  resize(width: number, height: number) {
    this.config.width = width;
    this.config.height = height;
  }

  setReducedMotion(value: boolean) {
    if (this.config.reducedMotion === value) return;
    this.config.reducedMotion = value;
    if (value) {
      this.stop();
      this.emitFrame();
      this.emitState();
    }
  }

  setAgentState(id: string, state: SwarmAgentState, taskLabel?: string) {
    const cursor = this.cursors.find((item) => item.id === id);
    if (!cursor) return;
    cursor.state = state;
    cursor.taskLabel = taskLabel;
    cursor.stateChangedAt = performance.now();
    if (state === "working" && !this.config.reducedMotion) {
      cursor.targetX = randomIn(0.12, 0.88);
      cursor.targetY = randomIn(0.15, 0.85);
    }
    this.emitState();
    this.emitFrame();
  }

  private simulate(): boolean {
    if (!this.config.simulation || this.config.reducedMotion) return false;
    const now = performance.now();
    let changed = false;
    for (const cursor of this.cursors) {
      if (cursor.state === "working" && Math.random() < 0.008) {
        cursor.targetX = randomIn(0.1, 0.9);
        cursor.targetY = randomIn(0.15, 0.85);
      }
      if (now - cursor.stateChangedAt > randomIn(4000, 9000)) {
        const states: SwarmAgentState[] = ["idle", "working", "waiting", "completed", "failed"];
        const next = states[Math.floor(Math.random() * states.length)];
        cursor.state = next;
        cursor.stateChangedAt = now;
        cursor.taskLabel =
          next === "working"
            ? ["Analyze", "Compile", "Search", "Review"][Math.floor(Math.random() * 4)]
            : next === "waiting" ? "Awaiting approval" : undefined;
        if (next === "working") {
          cursor.targetX = randomIn(0.1, 0.9);
          cursor.targetY = randomIn(0.15, 0.85);
        }
        changed = true;
      }
    }
    return changed;
  }

  private step(dt: number): boolean {
    if (this.config.reducedMotion) return false;
    for (const cursor of this.cursors) {
      const dx = cursor.targetX - cursor.x;
      const dy = cursor.targetY - cursor.y;
      cursor.vx = lerp(cursor.vx, dx * 2.2, 0.08);
      cursor.vy = lerp(cursor.vy, dy * 2.2, 0.08);
      cursor.x = clamp(cursor.x + cursor.vx * dt * 1.2, 0.04, 0.96);
      cursor.y = clamp(cursor.y + cursor.vy * dt * 1.2, 0.06, 0.94);
      if (cursor.state === "idle") {
        cursor.phase += dt * 1.4;
        cursor.x += Math.sin(cursor.phase) * 0.0008;
        cursor.y += Math.cos(cursor.phase * 0.9) * 0.0006;
      }
    }
    return this.simulate();
  }

  private loop = (timestamp: number) => {
    if (!this.running) return;
    const dt = this.lastTs ? Math.min((timestamp - this.lastTs) / 1000, 0.05) : 0.016;
    this.lastTs = timestamp;
    this.frame += 1;
    if (this.step(dt)) this.emitState();
    this.emitFrame();
    this.rafId = requestAnimationFrame(this.loop);
  };

  start() {
    if (this.running || this.config.reducedMotion) {
      if (this.config.reducedMotion) this.emitFrame();
      return;
    }
    this.running = true;
    this.lastTs = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
    this.listeners.clear();
    this.frameListeners.clear();
  }

  static stateColor(state: SwarmAgentState) {
    return STATE_COLORS[state];
  }
}
