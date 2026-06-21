export type GrowthStage = "child" | "teen" | "adult" | "elder";

export type GrowthConfig = {
  hatchMinutes: number;
  thresholds: ReadonlyArray<{ stage: GrowthStage; atMinutes: number }>;
};

const FAST_GROWTH_CONFIG: GrowthConfig = {
  hatchMinutes: 0.2,
  thresholds: [
    { stage: "child", atMinutes: 1 },
    { stage: "teen", atMinutes: 2 },
    { stage: "adult", atMinutes: 4 },
    { stage: "elder", atMinutes: 8 }
  ]
};

const PRODUCTION_GROWTH_CONFIG: GrowthConfig = {
  hatchMinutes: 25,
  thresholds: [
    { stage: "child", atMinutes: 60 },
    { stage: "teen", atMinutes: 180 },
    { stage: "adult", atMinutes: 420 },
    { stage: "elder", atMinutes: 900 }
  ]
};

function isFastGrowthEnabled() {
  return process.env.NODE_ENV === "test" || process.env.NEXT_PUBLIC_POMOCHI_FAST_GROWTH === "1";
}

export function getGrowthConfig(options?: { fastGrowth?: boolean }): GrowthConfig {
  const fastGrowth = options?.fastGrowth ?? isFastGrowthEnabled();
  return fastGrowth ? FAST_GROWTH_CONFIG : PRODUCTION_GROWTH_CONFIG;
}
