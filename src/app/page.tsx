import { auth } from "@clerk/nextjs/server";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth();

  if (session.userId) {
    redirect("/dashboard");
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle className="text-4xl">Find quotes across every episode instantly.</CardTitle>
        <CardDescription className="text-base">
          Import your RSS feed, transcribe episodes, and explore everything with semantic search and timestamped results.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={"/sign-up" as Route}>Get Started</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={"/sign-in" as Route}>Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
