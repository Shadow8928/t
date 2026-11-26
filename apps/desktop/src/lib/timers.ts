import {
  createRunningTimer,
  pauseSnapshot,
  reconcileTimerStates,
  remainingMs,
  resumeSnapshot,
} from "@system/domain";
import { db, newId, type LocalTimer } from "./db";
import { supabase } from "./supabase";
import { enqueueOp } from "./sync";

export async function getActiveTimer(): Promise<LocalTimer | undefined> {
  return db.timers.filter((t) => t.state === "running" || t.state === "paused").first();
}

export async function startLocalTimer(opts: {
  durationMs: number;
  taskId?: string | null;
  routineStepId?: string | null;
}): Promise<{ timer: LocalTimer; conflict?: boolean }> {
  const existing = await getActiveTimer();
  if (existing) {
    return { timer: existing, conflict: true };
  }

  if (supabase) {
    const { data, error } = await supabase.rpc("start_timer", {
      p_duration_ms: opts.durationMs,
      p_task_id: opts.taskId ?? null,
      p_routine_step_id: opts.routineStepId ?? null,
    });
    if (!error && data?.ok && data.timer) {
      const row = data.timer;
      const timer: LocalTimer = {
        id: row.id,
        taskId: row.task_id,
        routineStepId: row.routine_step_id,
        state: row.state,
        startedAt: row.started_at,
        endsAt: row.ends_at,
        pausedAt: row.paused_at,
        remainingMsWhenPaused: row.remaining_ms_when_paused,
        provisional: false,
        updatedAt: row.updated_at,
        version: row.version,
      };
      await db.timers.put(timer);
      return { timer };
    }
    if (data?.error === "timer_already_active") {
      const active = await getActiveTimer();
      if (active) return { timer: active, conflict: true };
    }
  }

  const snap = createRunningTimer(opts.durationMs);
  const timer: LocalTimer = {
    id: newId(),
    taskId: opts.taskId ?? null,
    routineStepId: opts.routineStepId ?? null,
    ...snap,
    provisional: !navigator.onLine || !supabase,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  await db.timers.put(timer);
  await enqueueOp({
    entityType: "timer",
    entityId: timer.id,
    op: "create",
    payload: { ...timer, durationMs: opts.durationMs },
    baseVersion: null,
  });
  return { timer };
}

export async function pauseActiveTimer(): Promise<LocalTimer | undefined> {
  const active = await getActiveTimer();
  if (!active || active.state !== "running") return active;
  if (supabase && !active.provisional) {
    await supabase.rpc("pause_timer", { p_timer_id: active.id });
  }
  const snap = pauseSnapshot(active);
  const updated = { ...active, ...snap, updatedAt: new Date().toISOString() };
  await db.timers.put(updated);
  return updated;
}

export async function resumeActiveTimer(): Promise<LocalTimer | undefined> {
  const active = await getActiveTimer();
  if (!active || active.state !== "paused") return active;
  if (supabase && !active.provisional) {
    await supabase.rpc("resume_timer", { p_timer_id: active.id });
  }
  const snap = resumeSnapshot(active);
  const updated = { ...active, ...snap, updatedAt: new Date().toISOString() };
  await db.timers.put(updated);
  return updated;
}

export async function cancelActiveTimer(): Promise<void> {
  const active = await getActiveTimer();
  if (!active) return;
  if (supabase && !active.provisional) {
    await supabase.rpc("cancel_timer", { p_timer_id: active.id });
  }
  await db.timers.put({
    ...active,
    state: "cancelled",
    updatedAt: new Date().toISOString(),
  });
}

export function liveRemaining(timer: LocalTimer, now = new Date()): number {
  return remainingMs(timer, now);
}

export async function reconcileWithServer(server: LocalTimer | null): Promise<boolean> {
  const local = (await getActiveTimer()) ?? null;
  const { winner, conflict } = reconcileTimerStates(local, server);
  if (winner) {
    const base: LocalTimer = local ?? {
      id: "server",
      taskId: null,
      routineStepId: null,
      provisional: false,
      updatedAt: new Date().toISOString(),
      version: 1,
      ...winner,
    };
    await db.timers.put({ ...base, ...winner, provisional: false });
  }
  return conflict;
}
