import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Imago Podcasting",
  description: "Semantic search for your podcast archive"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${display.variable} ${body.variable}`}>
        <body>
          <div className="page-shell">
            <header className="app-nav panel">
              <h1 className="heading">Imago Podcasting</h1>
              <div className="app-nav-links" aria-label="Primary navigation">
                <Link href="/onboarding">Onboarding</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/search">Search</Link>
                <Link href="/admin">Admin</Link>
              </div>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in">Sign In</Link>
              </SignedOut>
            </header>
            <main>{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
