import { validateTaskInput, type Priority, type RecurrenceRule, type TaskStatus } from "@system/domain";
import { db, newId, type LocalTask } from "./db";
import { enqueueOp } from "./sync";

export async function listTasks(): Promise<LocalTask[]> {
  return db.tasks.filter((t) => !t.deletedAt).toArray();
}

export async function createTask(input: {
  title: string;
  notes?: string;
  priority?: Priority;
  fixedTime?: boolean;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  recurrence?: RecurrenceRule | null;
}): Promise<LocalTask> {
  validateTaskInput(input);
  const now = new Date().toISOString();
  const task: LocalTask = {
    id: newId(),
    title: input.title.trim(),
    notes: input.notes ?? null,
    priority: input.priority ?? "normal",
    status: "pending",
    fixedTime: input.fixedTime ?? false,
    scheduledAt: input.scheduledAt ?? null,
    durationMinutes: input.durationMinutes ?? null,
    recurrence: input.recurrence ?? null,
    completedAt: null,
    deletedAt: null,
    updatedAt: now,
    version: 1,
  };
  await db.tasks.put(task);
  await enqueueOp({
    entityType: "task",
    entityId: task.id,
    op: "create",
    payload: {
      id: task.id,
      title: task.title,
      notes: task.notes,
      priority: task.priority,
      status: task.status,
      fixed_time: task.fixedTime,
      scheduled_at: task.scheduledAt,
      duration_minutes: task.durationMinutes,
      recurrence: task.recurrence,
      version: task.version,
    },
    baseVersion: null,
  });
  return task;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const existing = await db.tasks.get(id);
  if (!existing) return;
  const updated: LocalTask = {
    ...existing,
    status,
    completedAt: status === "completed" ? new Date().toISOString() : existing.completedAt,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  };
  await db.tasks.put(updated);
  await enqueueOp({
    entityType: "task",
    entityId: id,
    op: "update",
    payload: {
      id,
      status,
      completed_at: updated.completedAt,
      version: updated.version,
    },
    baseVersion: existing.version,
  });
}

export async function softDeleteTask(id: string): Promise<void> {
  const existing = await db.tasks.get(id);
  if (!existing) return;
  await db.tasks.put({
    ...existing,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  });
  await enqueueOp({
    entityType: "task",
    entityId: id,
    op: "delete",
    payload: {},
    baseVersion: existing.version,
  });
}
