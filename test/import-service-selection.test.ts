import { describe, expect, it } from "vitest";

import { resolveRequestedEpisodeCount } from "@/lib/services/import-selection";

describe("import service selection count", () => {
  it("uses the selected episode guids when both inputs are present", () => {
    expect(
      resolveRequestedEpisodeCount({
        requestedEpisodes: 1,
        selectedEpisodeGuids: ["guid-1", "guid-2", "guid-3"]
      })
    ).toBe(3);
  });

  it("falls back to the requested episode count when no guids are supplied", () => {
    expect(
      resolveRequestedEpisodeCount({
        requestedEpisodes: 4
      })
    ).toBe(4);
  });
});
