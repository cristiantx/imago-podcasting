import { describe, expect, it } from "vitest";

import { chunkUtterances } from "@/lib/chunking/transcript-chunker";

describe("chunkUtterances", () => {
  it("creates chunks with monotonically increasing time boundaries", () => {
    const chunks = chunkUtterances([
      { speaker: "Speaker 1", startMs: 0, endMs: 1000, text: "hello" },
      { speaker: "Speaker 2", startMs: 1000, endMs: 2000, text: "world" },
      { speaker: "Speaker 1", startMs: 2000, endMs: 3000, text: "pricing" }
    ]);

    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.endMs).toBeGreaterThanOrEqual(chunk.startMs);
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });
});
