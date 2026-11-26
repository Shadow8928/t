import type { Priority, RecurrenceRule, TaskInput, TaskStatus } from "./types.js";

const PRIORITIES: Priority[] = ["low", "normal", "high"];
const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed", "skipped"];

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export function assertValidTitle(title: string): void {
  const t = title.trim();
  if (!t) throw new ValidationError("Title is required", "title");
  if (t.length > 200) throw new ValidationError("Title max 200 characters", "title");
}

export function assertValidRecurrence(rule: RecurrenceRule): void {
  if (!rule.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(rule.startDate)) {
    throw new ValidationError("startDate must be YYYY-MM-DD", "recurrence.startDate");
  }
  if (rule.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(rule.endDate)) {
    throw new ValidationError("endDate must be YYYY-MM-DD", "recurrence.endDate");
  }
  if (rule.localTime != null && rule.localTime !== "" && !/^\d{2}:\d{2}$/.test(rule.localTime)) {
    throw new ValidationError("localTime must be HH:mm", "recurrence.localTime");
  }
  switch (rule.kind) {
    case "one_time":
    case "daily":
    case "weekday":
      break;
    case "weekly":
    case "selected_weekdays":
      if (!rule.weekdays?.length) {
        throw new ValidationError("weekdays required", "recurrence.weekdays");
      }
      for (const d of rule.weekdays) {
        if (d < 1 || d > 7) throw new ValidationError("weekday must be 1..7", "recurrence.weekdays");
      }
      break;
    case "interval":
      if (!rule.intervalDays || rule.intervalDays < 1) {
        throw new ValidationError("intervalDays must be >= 1", "recurrence.intervalDays");
      }
      break;
    default:
      throw new ValidationError("Unknown recurrence kind", "recurrence.kind");
  }
}

export function validateTaskInput(input: TaskInput): void {
  assertValidTitle(input.title);
  if (input.priority && !PRIORITIES.includes(input.priority)) {
    throw new ValidationError("Invalid priority", "priority");
  }
  if (input.status && !STATUSES.includes(input.status)) {
    throw new ValidationError("Invalid status", "status");
  }
  if (input.fixedTime && !input.scheduledAt && !input.recurrence?.localTime) {
    throw new ValidationError("Fixed-time tasks need scheduledAt or recurrence.localTime", "fixedTime");
  }
  if (input.durationMinutes != null && input.durationMinutes < 1) {
    throw new ValidationError("durationMinutes must be >= 1", "durationMinutes");
  }
  if (input.recurrence) assertValidRecurrence(input.recurrence);
}

/** Flexible tasks must never be auto-forced into fixed slots. */
export function canPlaceInFixedSlot(fixedTime: boolean, slotIsFixed: boolean): boolean {
  if (!slotIsFixed) return true;
  return fixedTime === true;
}
