import { AdminEntitlementsForm } from "@/components/admin-entitlements-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Entitlement Ops</CardTitle>
        <CardDescription>Weekend internal control panel for plan and credits management.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminEntitlementsForm />
      </CardContent>
    </Card>
  );
}
