import { SearchPanel } from "@/components/search-panel";

export default function SearchPage() {
  return (
    <section className="stack">
      <article className="panel" style={{ padding: 20 }}>
        <h2 className="heading" style={{ marginTop: 0, fontSize: "2rem" }}>
          Semantic Search
        </h2>
        <p className="muted">Find meaning-based mentions with exact timestamps and speaker context.</p>
      </article>
      <SearchPanel />
    </section>
  );
}
