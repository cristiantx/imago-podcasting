"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  BarChart3,
  Bell,
  LayoutGrid,
  Menu,
  AudioLines,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import {
  APP_SHELL_NAV_ITEMS,
  isNavItemActive,
  resolveAppHeaderConfig,
} from "@/lib/ui/app-shell-config";

type SidebarPodcast = {
  id: string;
  title: string | null;
  imageUrl: string | null;
};

type AppShellProps = {
  children: React.ReactNode;
  podcasts: SidebarPodcast[];
  planName: string;
};

export function AppShell({ children, podcasts, planName }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const headerConfig = useMemo(
    () => resolveAppHeaderConfig(pathname),
    [pathname],
  );
  const showShellHeader = headerConfig.showShellHeader ?? true;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-80 border-r border-white/75 bg-[linear-gradient(180deg,#ffffff_0%,#fcfbff_62%,#f8f4ff_100%)] shadow-[0_24px_80px_rgba(49,46,129,0.08)] lg:block">
        <SidebarContent
          pathname={pathname}
          podcasts={podcasts}
          userName={
            user?.fullName ??
            user?.firstName ??
            user?.primaryEmailAddress?.emailAddress ??
            "Workspace User"
          }
          planName={planName}
        />
      </aside>

      <button
        type="button"
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/35 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 border-r border-white/75 bg-[linear-gradient(180deg,#ffffff_0%,#fcfbff_62%,#f8f4ff_100%)] shadow-[0_24px_80px_rgba(49,46,129,0.14)] transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          pathname={pathname}
          podcasts={podcasts}
          userName={
            user?.fullName ??
            user?.firstName ??
            user?.primaryEmailAddress?.emailAddress ??
            "Workspace User"
          }
          planName={planName}
        />
      </aside>

      <div className="lg:pl-80">
        {showShellHeader ? (
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-5 lg:px-12">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-slate-700 lg:hidden"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="min-w-0">
                <h1
                  className="text-2xl font-bold tracking-tight text-slate-900 lg:max-w-[24rem] lg:text-3xl"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                  title={headerConfig.title}
                >
                  {headerConfig.title}
                </h1>
                <p
                  className="max-w-[30rem] truncate text-sm text-slate-500"
                  title={headerConfig.subtitle}
                >
                  {headerConfig.subtitle}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <label className="relative hidden sm:block">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    aria-label="Search episodes"
                    placeholder="Search episodes..."
                    className="h-10 w-64 rounded-full border border-white bg-white/90 pl-9 pr-4 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.06)] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white bg-white/90 text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-primary/45 hover:text-primary"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>
        ) : (
          <div className="px-4 pt-5 lg:hidden">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-slate-700"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <main className="px-4 py-6 lg:px-12 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  podcasts,
  userName,
  planName,
}: {
  pathname: string;
  podcasts: SidebarPodcast[];
  userName: string;
  planName: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-7">
        <Link href="/dashboard" className="inline-flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <AudioLines className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-[30px] font-bold leading-none tracking-tight text-slate-900">
            Imago
          </span>
        </Link>
      </div>

      <nav className="space-y-1 px-5 pt-5">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Menu
        </p>
        {APP_SHELL_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-[linear-gradient(90deg,rgba(168,85,247,0.20)_0%,rgba(192,132,252,0.14)_100%)] text-primary shadow-[inset_0_0_0_1px_rgba(168,85,247,0.14)]"
                  : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900",
              )}
            >
              {item.icon === "dashboard" ? (
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              ) : item.icon === "search" ? (
                <Search className="h-4 w-4" aria-hidden="true" />
              ) : (
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-5">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          My Podcasts
        </p>
        <div className="space-y-1.5 sidebar-scroll max-h-56 overflow-y-auto">
          {podcasts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-slate-500">
              No podcasts imported yet
            </p>
          ) : null}
          {podcasts.map((podcast) => {
            const href = `/podcasts/${podcast.id}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={podcast.id}
                href={href}
                className={cn(
                  active
                    ? "flex items-center gap-3 px-4 py-2 group bg-slate-50 dark:bg-white/5 rounded-lg transition-colors"
                    : "flex items-center gap-3 px-4 py-2 group hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors",
                )}
              >
                {podcast.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={podcast.imageUrl}
                    alt={`${podcast.title ?? "Podcast"} cover`}
                    className={cn(
                      active
                        ? "w-6 h-6 rounded-full object-cover ring-2 ring-primary/20"
                        : "w-6 h-6 rounded-full object-cover",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "grid w-6 h-6 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600",
                      active && "ring-2 ring-primary/20",
                    )}
                  >
                    {(podcast.title ?? "P").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span
                  className={cn(
                    active
                      ? "text-xs font-semibold text-slate-900 dark:text-white truncate"
                      : "text-xs font-medium text-slate-600 dark:text-slate-400 truncate",
                  )}
                >
                  {podcast.title ?? "Untitled Podcast"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto px-5 pt-4">
        <Link
          href="/onboarding"
          className={cn(
            "mb-5 flex h-11 w-full items-center justify-center rounded-full border text-sm font-semibold transition",
            pathname === "/onboarding"
              ? "border-primary/45 bg-[linear-gradient(90deg,rgba(168,85,247,0.18)_0%,rgba(196,181,253,0.20)_100%)] text-primary shadow-[0_8px_20px_rgba(147,51,234,0.12)]"
              : "border-primary/25 bg-[linear-gradient(90deg,rgba(168,85,247,0.08)_0%,rgba(196,181,253,0.12)_100%)] text-primary hover:border-primary/45 hover:bg-[linear-gradient(90deg,rgba(168,85,247,0.16)_0%,rgba(196,181,253,0.18)_100%)]",
          )}
        >
          + Add New Feed
        </Link>
      </div>

      <div className="border-t border-white/80 px-5 py-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="shrink-0 self-center">
            <UserButton
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  userButtonTrigger: "h-9 w-9 overflow-hidden rounded-full p-0",
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
          <div className="min-w-0 self-center">
            <p className="truncate text-sm font-semibold leading-tight text-slate-900">
              {userName}
            </p>
            <p className="mt-0.5 truncate text-xs leading-tight text-slate-500">
              {formatPlanName(planName)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPlanName(planName: string) {
  if (!planName) {
    return "Free Plan";
  }

  return /plan/i.test(planName) ? planName : `${planName} Plan`;
}
