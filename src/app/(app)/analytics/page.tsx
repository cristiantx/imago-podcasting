import Link from "next/link";

export default function AnalyticsPage() {
  return (
    <section className="space-y-4">
      <div className="app-shell-card p-6 lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Analytics</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Analytics workspace coming soon</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          This section will host podcast performance dashboards. For now, entitlement operations and internal controls remain available in Settings.
        </p>
        <div className="mt-5">
          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-primary/45 hover:text-primary"
          >
            Open Settings
          </Link>
        </div>
      </div>
    </section>
  );
}
