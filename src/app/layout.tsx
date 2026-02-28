import type { Metadata, Route } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import "./globals.css";

export const metadata: Metadata = {
  title: "Imago Podcasting",
  description: "Semantic search for your podcast archive"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="container py-6 md:py-8">
            <header className="mb-6">
              <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                <h1 className="text-xl md:text-2xl">Imago Podcasting</h1>
                <nav className="flex flex-wrap items-center gap-2" aria-label="Primary navigation">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={"/onboarding" as Route}>Onboarding</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={"/dashboard" as Route}>Dashboard</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={"/search" as Route}>Search</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={"/admin" as Route}>Admin</Link>
                  </Button>
                </nav>
                <div>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                  <SignedOut>
                    <Button asChild>
                      <Link href={"/sign-in" as Route}>Sign In</Link>
                    </Button>
                  </SignedOut>
                </div>
              </Card>
            </header>
            <main className="page-transition">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
