import { AdminEntitlementsForm } from "@/components/admin-entitlements-form";

export default function AdminPage() {
  return (
    <section className="panel" style={{ padding: 20 }}>
      <h2 className="heading" style={{ marginTop: 0, fontSize: "2rem" }}>
        Entitlement Ops
      </h2>
      <p className="muted">Weekend internal control panel for plan and credits management.</p>
      <AdminEntitlementsForm />
    </section>
  );
}
