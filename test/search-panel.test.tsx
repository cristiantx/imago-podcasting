import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchPanel } from "@/components/search-panel";

describe("SearchPanel", () => {
  it("labels the transcript search input", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SearchPanel, {
        podcasts: [
          {
            id: "pod-1",
            title: "Design Matters",
            imageUrl: null,
            episodeCount: 12
          }
        ]
      })
    );

    expect(markup).toContain('aria-label="Search transcripts"');
  });
});
