import { StatusBoard } from "@/components/status-board";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Ingestion Status</CardTitle>
          <CardDescription>Track imports, failures, and sync progress per feed.</CardDescription>
        </CardHeader>
      </Card>
      <StatusBoard />
    </section>
  );
}
