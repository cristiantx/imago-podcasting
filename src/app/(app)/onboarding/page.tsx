import { RssImportForm } from "@/components/rss-import-form";

export default function OnboardingPage() {
  return (
    <section className="mx-auto w-full max-w-[980px] space-y-5">
      <div className="space-y-1">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-900">Add New Podcast</h2>
        <p className="text-base text-muted-foreground">Import episodes from an RSS feed to start analyzing.</p>
      </div>

      <RssImportForm />
    </section>
  );
}
