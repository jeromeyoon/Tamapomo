import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("Next build/dev output separation", () => {
  it("keeps the dev server output separate from production build output", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    const nextConfig = readFileSync("next.config.mjs", "utf8");

    expect(packageJson.scripts.dev).toBe("next dev -p 3001");
    expect(packageJson.scripts.build).toContain("NEXT_DIST_DIR=.next-build");
    expect(nextConfig).toContain("distDir");
    expect(nextConfig).toContain("NEXT_DIST_DIR");
  });
});
