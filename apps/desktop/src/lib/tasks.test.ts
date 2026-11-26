import { describe, expect, it } from "vitest";
import { canPlaceInFixedSlot } from "@system/domain";

describe("desktop domain wiring", () => {
  it("keeps flexible tasks out of fixed slots", () => {
    expect(canPlaceInFixedSlot(false, true)).toBe(false);
  });
});
