import { SignedIn, SignedOut } from "@clerk/nextjs";
import type { Route } from "next";
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="panel" style={{ padding: 28 }}>
      <h2 className="heading" style={{ marginTop: 0, fontSize: "2.4rem", lineHeight: 0.95 }}>
        Your entire podcast archive, searchable by meaning.
      </h2>
      <p className="muted" style={{ maxWidth: 720 }}>
        Paste one RSS feed and index your full catalog with speaker-aware transcripts, semantic vectors, and timestamped results.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <SignedOut>
          <Link href={"/sign-up" as Route}>
            <button className="primary">Start Free</button>
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href={"/onboarding" as Route}>
            <button className="primary">Connect RSS Feed</button>
          </Link>
        </SignedIn>
        <Link href={"/search" as Route}>
          <button className="secondary">View Search Demo</button>
        </Link>
      </div>
    </section>
  );
}
