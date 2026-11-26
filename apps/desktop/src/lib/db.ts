import Dexie, { type Table } from "dexie";
import type { Priority, RecurrenceRule, RoutineKind, TaskStatus, TimerState } from "@system/domain";

export interface LocalTask {
  id: string;
  title: string;
  notes: string | null;
  priority: Priority;
  status: TaskStatus;
  fixedTime: boolean;
  scheduledAt: string | null;
  durationMinutes: number | null;
  recurrence: RecurrenceRule | null;
  completedAt: string | null;
  deletedAt: string | null;
  updatedAt: string;
  version: number;
}

export interface LocalRoutine {
  id: string;
  name: string;
  kind: RoutineKind;
  steps: Array<{ id: string; title: string; durationMinutes: number; sortOrder: number }>;
  deletedAt: string | null;
  updatedAt: string;
  version: number;
}

export interface LocalTimer {
  id: string;
  taskId: string | null;
  routineStepId: string | null;
  state: TimerState;
  startedAt: string;
  endsAt: string;
  pausedAt: string | null;
  remainingMsWhenPaused: number | null;
  provisional: boolean;
  updatedAt: string;
  version: number;
}

export interface PendingOp {
  id?: number;
  clientOpId: string;
  entityType: "task" | "routine" | "timer" | "profile";
  entityId: string;
  op: "create" | "update" | "delete";
  payload: Record<string, unknown>;
  baseVersion: number | null;
  createdAt: string;
  attempts: number;
}

export interface MetaRow {
  key: string;
  value: string;
}

export class SystemDb extends Dexie {
  tasks!: Table<LocalTask, string>;
  routines!: Table<LocalRoutine, string>;
  timers!: Table<LocalTimer, string>;
  pendingOps!: Table<PendingOp, number>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("system");
    this.version(1).stores({
      tasks: "id, status, scheduledAt, updatedAt",
      routines: "id, kind, updatedAt",
      timers: "id, state, updatedAt",
      pendingOps: "++id, clientOpId, entityType, createdAt",
      meta: "key",
    });
  }
}

export const db = new SystemDb();

export function newId(): string {
  return crypto.randomUUID();
}
