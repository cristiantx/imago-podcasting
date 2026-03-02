export type AppShellNavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "search" | "analytics";
  match: "exact" | "prefix";
};

export type AppHeaderConfig = {
  title: string;
  subtitle: string;
};

const DEFAULT_HEADER: AppHeaderConfig = {
  title: "Imago Workspace",
  subtitle: "Manage your podcast episodes and transcripts."
};

const HEADER_BY_PATH: Record<string, AppHeaderConfig> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Manage your episodes and track performance"
  },
  "/search": {
    title: "Semantic Search",
    subtitle: "Find exact transcript moments with natural language queries"
  },
  "/onboarding": {
    title: "Add New Feed",
    subtitle: "Import your podcast RSS feed and start processing episodes"
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Performance views and reporting are coming soon"
  },
  "/admin": {
    title: "Settings",
    subtitle: "Manage entitlements and internal operations"
  }
};

const PODCAST_DETAIL_PATH = /^\/podcasts\/[^/]+$/;

export const APP_SHELL_NAV_ITEMS: AppShellNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", match: "exact" },
  { href: "/search", label: "Semantic Search", icon: "search", match: "prefix" },
  { href: "/analytics", label: "Analytics", icon: "analytics", match: "prefix" }
];

export function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function resolveAppHeaderConfig(pathname: string): AppHeaderConfig {
  const normalizedPath = normalizePathname(pathname);

  if (PODCAST_DETAIL_PATH.test(normalizedPath)) {
    return {
      title: "Podcast Episodes",
      subtitle: "Track processing status and manage transcript exports"
    };
  }

  return HEADER_BY_PATH[normalizedPath] ?? DEFAULT_HEADER;
}

export function isNavItemActive(item: AppShellNavItem, pathname: string) {
  const normalizedPath = normalizePathname(pathname);

  if (item.match === "exact") {
    return normalizedPath === item.href;
  }

  return normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);
}
