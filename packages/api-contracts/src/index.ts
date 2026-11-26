import type {
  Priority,
  TaskStatus,
  RecurrenceRule,
  RoutineKind,
  SyncOpType,
} from "@system/domain";

export interface UserProfileDto {
  id: string;
  email: string;
  displayName: string | null;
  timezone: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TaskDto {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  priority: Priority;
  status: TaskStatus;
  fixedTime: boolean;
  scheduledAt: string | null;
  durationMinutes: number | null;
  recurrence: RecurrenceRule | null;
  parentOccurrenceDate: string | null;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TimerSessionDto {
  id: string;
  userId: string;
  taskId: string | null;
  routineStepId: string | null;
  state: "running" | "paused" | "completed" | "cancelled";
  startedAt: string;
  endsAt: string;
  pausedAt: string | null;
  remainingMsWhenPaused: number | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RoutineDto {
  id: string;
  userId: string;
  name: string;
  kind: RoutineKind;
  steps: RoutineStepDto[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RoutineStepDto {
  id: string;
  routineId: string;
  title: string;
  durationMinutes: number;
  sortOrder: number;
}

export interface SyncOpDto {
  id: string;
  clientOpId: string;
  userId: string;
  entityType: string;
  entityId: string;
  op: SyncOpType;
  payload: Record<string, unknown>;
  baseVersion: number | null;
  createdAt: string;
}

export interface SyncPushRequest {
  deviceId: string;
  ops: SyncOpDto[];
  cursor: string | null;
}

export interface SyncPushResponse {
  applied: string[];
  conflicts: Array<{
    clientOpId: string;
    entityType: string;
    entityId: string;
    serverVersion: number;
    serverPayload: Record<string, unknown>;
  }>;
  cursor: string;
}

export interface TimerRpcResult {
  ok: boolean;
  error?: "timer_already_active" | "timer_not_found" | "invalid_state" | "unauthorized";
  timer?: TimerSessionDto;
}

export type { Priority, TaskStatus, RecurrenceRule, RoutineKind, SyncOpType };
