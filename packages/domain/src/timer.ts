import type { TimerSnapshot, TimerState } from "./types.js";

export function remainingMs(snapshot: TimerSnapshot, now: Date = new Date()): number {
  if (snapshot.state === "completed" || snapshot.state === "cancelled") return 0;
  if (snapshot.state === "paused") {
    return Math.max(0, snapshot.remainingMsWhenPaused ?? 0);
  }
  const ends = new Date(snapshot.endsAt).getTime();
  return Math.max(0, ends - now.getTime());
}

export function formatDuration(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function isExpired(snapshot: TimerSnapshot, now: Date = new Date()): boolean {
  if (snapshot.state !== "running") return false;
  return remainingMs(snapshot, now) <= 0;
}

export function pauseSnapshot(snapshot: TimerSnapshot, now: Date = new Date()): TimerSnapshot {
  if (snapshot.state !== "running") return snapshot;
  return {
    ...snapshot,
    state: "paused",
    pausedAt: now.toISOString(),
    remainingMsWhenPaused: remainingMs(snapshot, now),
  };
}

export function resumeSnapshot(snapshot: TimerSnapshot, now: Date = new Date()): TimerSnapshot {
  if (snapshot.state !== "paused") return snapshot;
  const remaining = snapshot.remainingMsWhenPaused ?? 0;
  return {
    ...snapshot,
    state: "running",
    pausedAt: null,
    remainingMsWhenPaused: null,
    endsAt: new Date(now.getTime() + remaining).toISOString(),
  };
}

export function createRunningTimer(durationMs: number, now: Date = new Date()): TimerSnapshot {
  return {
    state: "running",
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + durationMs).toISOString(),
    pausedAt: null,
    remainingMsWhenPaused: null,
  };
}

export function reconcileTimerStates(
  local: TimerSnapshot | null,
  server: TimerSnapshot | null,
): { winner: TimerSnapshot | null; conflict: boolean } {
  if (!local && !server) return { winner: null, conflict: false };
  if (!local) return { winner: server, conflict: false };
  if (!server) return { winner: local, conflict: false };

  const active = (s: TimerState) => s === "running" || s === "paused";
  if (active(local.state) && active(server.state) && local.startedAt !== server.startedAt) {
    // Server is authoritative for exclusivity; surface conflict to UI.
    return { winner: server, conflict: true };
  }
  // Prefer newer endsAt for same session
  if (new Date(server.endsAt).getTime() >= new Date(local.endsAt).getTime()) {
    return { winner: server, conflict: false };
  }
  return { winner: local, conflict: false };
}
