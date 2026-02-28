import type { Metadata, Route } from "next";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import "./globals.css";

export const metadata: Metadata = {
  title: "Imago Podcasting",
  description: "Search and explore your podcast archive"
};

const navItems: Array<{ href: Route; label: string }> = [
  { href: "/dashboard" as Route, label: "Dashboard" },
  { href: "/search" as Route, label: "Search" },
  { href: "/onboarding" as Route, label: "Add Feed" },
  { href: "/admin" as Route, label: "Settings" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SignedIn>
            <div className="min-h-screen px-3 py-4 md:px-6 md:py-8">
              <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[30px] border border-white/50 bg-[#f2f4fa]/85 shadow-[0_30px_100px_rgba(42,45,78,0.24)] backdrop-blur-xl">
                <div className="grid min-h-[82vh] grid-cols-1 md:grid-cols-[230px_1fr]">
                  <aside className="hidden border-r border-white/50 bg-white/55 p-5 md:flex md:flex-col">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">I</div>
                      <div>
                        <p className="text-base font-semibold">Imago</p>
                        <p className="text-xs text-muted-foreground">Podcast Workspace</p>
                      </div>
                    </div>

                    <nav className="space-y-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-foreground/90 transition hover:border-border hover:bg-white/70"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    <div className="mt-auto rounded-2xl border border-border/70 bg-white/70 p-3 text-xs text-muted-foreground">
                      Keep your transcripts downloadable and searchable in one place.
                    </div>
                  </aside>

                  <div className="min-w-0">
                    <header className="border-b border-white/50 px-4 py-3 md:px-6">
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="Search your podcasts, episodes, and notes"
                          className="h-10 rounded-full border-white/60 bg-white/75"
                          aria-label="workspace search"
                        />
                        <div className="ml-auto">
                          <UserButton />
                        </div>
                      </div>
                    </header>

                    <main className="page-transition p-4 md:p-6">{children}</main>
                  </div>
                </div>
              </div>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10">
              <section className="glass-panel w-full p-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">Imago Podcasting</p>
                    <p className="text-sm text-muted-foreground">Search your archive by meaning</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={"/sign-up" as Route}>Create Account</Link>
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={"/sign-in" as Route}>Sign In</Link>
                    </Button>
                  </div>
                </div>
                {children}
              </section>
            </div>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
