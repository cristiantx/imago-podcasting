import { describe, expect, it } from "vitest";

import { normalizeEpisodeSeekParam } from "@/lib/ui/episode-seek";

describe("episode seek helper", () => {
  it("parses valid seek values", () => {
    expect(normalizeEpisodeSeekParam("42")).toBe(42);
    expect(normalizeEpisodeSeekParam(["8.5"])).toBe(8.5);
  });

  it("ignores invalid or negative seek values", () => {
    expect(normalizeEpisodeSeekParam(undefined)).toBeNull();
    expect(normalizeEpisodeSeekParam("nope")).toBeNull();
    expect(normalizeEpisodeSeekParam("-3")).toBeNull();
  });
});
