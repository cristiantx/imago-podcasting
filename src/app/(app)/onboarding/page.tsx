import { RssImportForm } from "@/components/rss-import-form";
import { EntitlementPanel } from "@/components/entitlement-panel";

export default function OnboardingPage() {
  return (
    <section className="split">
      <article className="panel" style={{ padding: 20 }}>
        <h2 className="heading" style={{ marginTop: 0, fontSize: "2rem" }}>
          Connect Your Feed
        </h2>
        <p className="muted">Public RSS only for MVP. Imports respect your plan quota + credits.</p>
        <RssImportForm />
      </article>
      <EntitlementPanel />
    </section>
  );
}
