import { describe, expect, it } from "vitest";
import {
  canPlaceInFixedSlot,
  validateTaskInput,
  ValidationError,
} from "./validation.js";
import { validateRoutine } from "./routines.js";

describe("validateTaskInput", () => {
  it("requires title", () => {
    expect(() => validateTaskInput({ title: "  " })).toThrow(ValidationError);
  });

  it("accepts valid task", () => {
    expect(() =>
      validateTaskInput({
        title: "Write brief",
        priority: "high",
        fixedTime: true,
        scheduledAt: "2026-11-26T09:00:00-06:00",
      }),
    ).not.toThrow();
  });

  it("rejects fixed without schedule", () => {
    expect(() => validateTaskInput({ title: "X", fixedTime: true })).toThrow(/Fixed-time/);
  });

  it("never auto-forces flexible into fixed slots", () => {
    expect(canPlaceInFixedSlot(false, true)).toBe(false);
    expect(canPlaceInFixedSlot(true, true)).toBe(true);
    expect(canPlaceInFixedSlot(false, false)).toBe(true);
  });
});

describe("validateRoutine", () => {
  it("requires ordered unique steps", () => {
    expect(() =>
      validateRoutine({
        name: "Morning",
        kind: "morning",
        steps: [
          { title: "Water", durationMinutes: 2, sortOrder: 0 },
          { title: "Stretch", durationMinutes: 5, sortOrder: 0 },
        ],
      }),
    ).toThrow(/Duplicate/);
  });
});
