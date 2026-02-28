import { SearchPanel } from "@/components/search-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Semantic Search</CardTitle>
          <CardDescription>Find meaning-based mentions with exact timestamps and speaker context.</CardDescription>
        </CardHeader>
      </Card>
      <SearchPanel />
    </section>
  );
}
