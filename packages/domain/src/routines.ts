import type { RoutineKind } from "./types.js";
import { ValidationError } from "./validation.js";

export interface RoutineStepInput {
  id?: string;
  title: string;
  durationMinutes: number;
  sortOrder: number;
}

export interface RoutineInput {
  name: string;
  kind: RoutineKind;
  steps: RoutineStepInput[];
}

const KINDS: RoutineKind[] = ["morning", "night", "custom"];

export function validateRoutine(input: RoutineInput): void {
  if (!input.name.trim()) throw new ValidationError("Routine name required", "name");
  if (!KINDS.includes(input.kind)) throw new ValidationError("Invalid routine kind", "kind");
  if (!input.steps.length) throw new ValidationError("At least one step required", "steps");
  const orders = new Set<number>();
  for (const step of input.steps) {
    if (!step.title.trim()) throw new ValidationError("Step title required", "steps.title");
    if (step.durationMinutes < 1) {
      throw new ValidationError("Step duration must be >= 1", "steps.durationMinutes");
    }
    if (orders.has(step.sortOrder)) {
      throw new ValidationError("Duplicate step sortOrder", "steps.sortOrder");
    }
    orders.add(step.sortOrder);
  }
}

export function orderedSteps<T extends { sortOrder: number }>(steps: T[]): T[] {
  return [...steps].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function totalRoutineMinutes(steps: { durationMinutes: number }[]): number {
  return steps.reduce((sum, s) => sum + s.durationMinutes, 0);
}
