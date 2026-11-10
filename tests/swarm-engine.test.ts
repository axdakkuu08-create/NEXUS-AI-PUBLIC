import assert from "node:assert/strict";
import test from "node:test";
import { SwarmEngine, type SwarmEngineRuntime } from "../src/lib/swarm/engine.ts";

function createHarness(random = () => 0.5) {
  let now = 100;
  let nextId = 0;
  const scheduled = new Map<number, FrameRequestCallback>();
  const cancelled: number[] = [];
  const runtime: SwarmEngineRuntime = {
    now: () => now,
    random,
    requestAnimationFrame: (callback) => {
      const id = ++nextId;
      scheduled.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => {
      cancelled.push(id);
      scheduled.delete(id);
    },
  };

  return {
    runtime,
    scheduled,
    cancelled,
    setNow(value: number) {
      now = value;
    },
    flush(timestamp: number) {
      const entry = scheduled.entries().next().value as
        | [number, FrameRequestCallback]
        | undefined;
      assert.ok(entry, "expected one scheduled animation frame");
      const [id, callback] = entry;
      scheduled.delete(id);
      callback(timestamp);
    },
  };
}

test("seed and state transitions are deterministic with an injected runtime", () => {
  const harness = createHarness(() => 0.99);
  const engine = new SwarmEngine({ agentCount: 1 }, harness.runtime);
  assert.equal(engine.getSnapshot().cursors[0]?.state, "idle");

  engine.start();
  harness.setNow(9_000);
  harness.flush(9_000);

  assert.equal(engine.getSnapshot().cursors[0]?.state, "failed");
  engine.destroy();
});

test("animation frames notify canvas listeners without notifying state subscribers", () => {
  const harness = createHarness(() => 0.1);
  const engine = new SwarmEngine({ agentCount: 1 }, harness.runtime);
  let stateNotifications = 0;
  let frameNotifications = 0;
  engine.subscribe(() => stateNotifications++);
  engine.subscribeFrames(() => frameNotifications++);

  engine.start();
  harness.flush(116);

  assert.equal(stateNotifications, 1, "only the initial snapshot should be emitted");
  assert.equal(frameNotifications, 1);
  engine.destroy();
});

test("stop pauses frame progression and start resumes it", () => {
  const harness = createHarness();
  const engine = new SwarmEngine({ agentCount: 1, simulation: false }, harness.runtime);

  engine.start();
  harness.flush(116);
  const pausedAt = engine.getSnapshot().frame;
  assert.equal(harness.scheduled.size, 1);

  engine.stop();
  assert.equal(harness.scheduled.size, 0);
  assert.equal(harness.cancelled.length, 1);
  assert.equal(engine.getSnapshot().frame, pausedAt);

  engine.start();
  assert.equal(harness.scheduled.size, 1);
  harness.flush(232);
  assert.equal(engine.getSnapshot().frame, pausedAt + 1);
  engine.destroy();
});

test("reduced motion cancels animation and prevents restart until preference clears", () => {
  const harness = createHarness();
  const engine = new SwarmEngine({ agentCount: 1 }, harness.runtime);

  engine.start();
  assert.equal(harness.scheduled.size, 1);
  engine.setReducedMotion(true);
  assert.equal(harness.scheduled.size, 0);

  engine.start();
  assert.equal(harness.scheduled.size, 0);
  engine.setReducedMotion(false);
  engine.start();
  assert.equal(harness.scheduled.size, 1);
  engine.destroy();
});

test("simulation=false keeps agent states stable across elapsed time", () => {
  const harness = createHarness(() => 0.99);
  const engine = new SwarmEngine({ agentCount: 1, simulation: false }, harness.runtime);
  const initialState = engine.getSnapshot().cursors[0]?.state;

  engine.start();
  harness.setNow(20_000);
  harness.flush(20_000);

  assert.equal(engine.getSnapshot().cursors[0]?.state, initialState);
  engine.destroy();
});
