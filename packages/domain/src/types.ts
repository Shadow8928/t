/** ISO weekday: Mon=1 … Sun=7 */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Priority = "low" | "normal" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";
export type RoutineKind = "morning" | "night" | "custom";
export type SyncOpType = "create" | "update" | "delete";
export type TimerState = "running" | "paused" | "completed" | "cancelled";

export type RecurrenceKind =
  | "one_time"
  | "daily"
  | "weekday"
  | "weekly"
  | "selected_weekdays"
  | "interval";

export interface RecurrenceRule {
  kind: RecurrenceKind;
  /** For weekly / selected_weekdays */
  weekdays?: IsoWeekday[];
  /** Interval in days for kind=interval (must be >= 1) */
  intervalDays?: number;
  /** Local time HH:mm for fixed-time tasks; null/omit for flexible */
  localTime?: string | null;
  /** Inclusive start date YYYY-MM-DD in task timezone */
  startDate: string;
  /** Optional exclusive end date YYYY-MM-DD */
  endDate?: string | null;
}

export interface TaskInput {
  title: string;
  notes?: string | null;
  priority?: Priority;
  status?: TaskStatus;
  fixedTime?: boolean;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  recurrence?: RecurrenceRule | null;
  timezone?: string;
}

export interface Occurrence {
  date: string;
  scheduledAt: string | null;
  fixedTime: boolean;
}

export interface TimerSnapshot {
  state: TimerState;
  startedAt: string;
  endsAt: string;
  pausedAt: string | null;
  remainingMsWhenPaused: number | null;
}
