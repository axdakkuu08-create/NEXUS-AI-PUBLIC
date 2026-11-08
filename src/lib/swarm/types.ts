export type SwarmAgentState = "idle" | "working" | "waiting" | "completed" | "failed";

export interface SwarmAgentIdentity {
  id: string;
  name: string;
  color: string;
  role?: string;
}

export interface SwarmCursor {
  id: string;
  identity: SwarmAgentIdentity;
  state: SwarmAgentState;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  phase: number;
  taskLabel?: string;
  stateChangedAt: number;
}

export interface SwarmEngineConfig {
  agentCount: number;
  width: number;
  height: number;
  reducedMotion: boolean;
  simulation: boolean;
}

export interface SwarmEngineSnapshot {
  cursors: SwarmCursor[];
  timestamp: number;
  frame: number;
}
