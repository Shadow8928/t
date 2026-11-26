import { describe, expect, it } from "vitest";
import {
  createRunningTimer,
  formatDuration,
  isExpired,
  pauseSnapshot,
  reconcileTimerStates,
  remainingMs,
  resumeSnapshot,
} from "./timer.js";

describe("timer", () => {
  it("computes remaining from endsAt", () => {
    const now = new Date("2026-11-26T12:00:00.000Z");
    const snap = createRunningTimer(5 * 60_000, now);
    expect(remainingMs(snap, now)).toBe(300_000);
    expect(remainingMs(snap, new Date(now.getTime() + 60_000))).toBe(240_000);
  });

  it("pause freezes remaining; resume extends endsAt", () => {
    const t0 = new Date("2026-11-26T12:00:00.000Z");
    const running = createRunningTimer(10 * 60_000, t0);
    const t1 = new Date(t0.getTime() + 2 * 60_000);
    const paused = pauseSnapshot(running, t1);
    expect(paused.state).toBe("paused");
    expect(paused.remainingMsWhenPaused).toBe(8 * 60_000);
    expect(remainingMs(paused, new Date(t1.getTime() + 60_000))).toBe(8 * 60_000);

    const t2 = new Date(t1.getTime() + 5 * 60_000);
    const resumed = resumeSnapshot(paused, t2);
    expect(resumed.state).toBe("running");
    expect(remainingMs(resumed, t2)).toBe(8 * 60_000);
  });

  it("detects expiry", () => {
    const t0 = new Date("2026-11-26T12:00:00.000Z");
    const snap = createRunningTimer(60_000, t0);
    expect(isExpired(snap, new Date(t0.getTime() + 61_000))).toBe(true);
  });

  it("formats duration", () => {
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(3_661_000)).toBe("1:01:01");
  });

  it("reconcile surfaces conflict for two active sessions", () => {
    const local = createRunningTimer(60_000, new Date("2026-11-26T12:00:00.000Z"));
    const server = createRunningTimer(120_000, new Date("2026-11-26T12:01:00.000Z"));
    const result = reconcileTimerStates(local, server);
    expect(result.conflict).toBe(true);
    expect(result.winner).toEqual(server);
  });
});
