import { SignedIn, SignedOut } from "@clerk/nextjs";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-4xl leading-[0.95] md:text-5xl">Your entire podcast archive, searchable by meaning.</CardTitle>
        <CardDescription className="max-w-3xl text-base">
          Paste one RSS feed and index your full catalog with speaker-aware transcripts, semantic vectors, and timestamped results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <SignedOut>
            <Button asChild>
              <Link href={"/sign-up" as Route}>Start Free</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button asChild>
              <Link href={"/onboarding" as Route}>Connect RSS Feed</Link>
            </Button>
          </SignedIn>
          <Button variant="secondary" asChild>
            <Link href={"/search" as Route}>View Search Demo</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
