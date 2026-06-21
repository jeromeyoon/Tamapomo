import { describe, expect, it } from "vitest";

import { getGrowthConfig } from "@/lib/growth-config";

describe("growth config", () => {
  it("separates fast test values from production defaults", () => {
    expect(getGrowthConfig({ fastGrowth: true })).toEqual({
      hatchMinutes: 0.2,
      thresholds: [
        { stage: "child", atMinutes: 1 },
        { stage: "teen", atMinutes: 2 },
        { stage: "adult", atMinutes: 4 },
        { stage: "elder", atMinutes: 8 }
      ]
    });

    expect(getGrowthConfig({ fastGrowth: false })).toEqual({
      hatchMinutes: 25,
      thresholds: [
        { stage: "child", atMinutes: 60 },
        { stage: "teen", atMinutes: 180 },
        { stage: "adult", atMinutes: 420 },
        { stage: "elder", atMinutes: 900 }
      ]
    });
  });
});
