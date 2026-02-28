import type { Metadata, Route } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

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
          <div className="page-shell">
            <header className="app-nav panel">
              <h1 className="heading">Imago Podcasting</h1>
              <div className="app-nav-links" aria-label="Primary navigation">
                <Link href={"/onboarding" as Route}>Onboarding</Link>
                <Link href={"/dashboard" as Route}>Dashboard</Link>
                <Link href={"/search" as Route}>Search</Link>
                <Link href={"/admin" as Route}>Admin</Link>
              </div>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link href={"/sign-in" as Route}>Sign In</Link>
              </SignedOut>
            </header>
            <main>{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
