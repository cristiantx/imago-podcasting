import { describe, expect, it } from "vitest";

import { APP_SHELL_NAV_ITEMS, isNavItemActive, normalizePathname, resolveAppHeaderConfig } from "@/lib/ui/app-shell-config";

describe("app shell config", () => {
  it("resolves header config for static routes", () => {
    const dashboardHeader = resolveAppHeaderConfig("/dashboard");
    const searchHeader = resolveAppHeaderConfig("/search");

    expect(dashboardHeader.title).toBe("Dashboard");
    expect(searchHeader.title).toBe("Semantic Search");
  });

  it("resolves podcast details header for dynamic routes", () => {
    const header = resolveAppHeaderConfig("/podcasts/abc-123");

    expect(header.title).toBe("Podcast Episodes");
  });

  it("normalizes trailing slashes", () => {
    expect(normalizePathname("/analytics/")).toBe("/analytics");
  });

  it("computes nav active states for exact and prefix routes", () => {
    const dashboard = APP_SHELL_NAV_ITEMS.find((item) => item.href === "/dashboard");
    const search = APP_SHELL_NAV_ITEMS.find((item) => item.href === "/search");

    expect(dashboard).toBeDefined();
    expect(search).toBeDefined();

    expect(isNavItemActive(dashboard!, "/dashboard")).toBe(true);
    expect(isNavItemActive(dashboard!, "/dashboard/stats")).toBe(false);
    expect(isNavItemActive(search!, "/search")).toBe(true);
    expect(isNavItemActive(search!, "/search/history")).toBe(true);
  });
});
