import { EntitlementPanel } from "@/components/entitlement-panel";
import { RssImportForm } from "@/components/rss-import-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Connect Your Feed</CardTitle>
          <CardDescription>Public RSS only for MVP. Imports respect your plan quota + credits.</CardDescription>
        </CardHeader>
        <CardContent>
          <RssImportForm />
        </CardContent>
      </Card>
      <EntitlementPanel />
    </section>
  );
}
