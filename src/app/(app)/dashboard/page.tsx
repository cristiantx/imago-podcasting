import { StatusBoard } from "@/components/status-board";

export default function DashboardPage() {
  return (
    <section className="stack">
      <article className="panel" style={{ padding: 20 }}>
        <h2 className="heading" style={{ marginTop: 0, fontSize: "2rem" }}>
          Ingestion Status
        </h2>
        <p className="muted">Track imports, failures, and sync progress per feed.</p>
      </article>
      <StatusBoard />
    </section>
  );
}
