import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Imago Podcasting",
  description: "Search and explore your podcast archive"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <SignedIn>{children}</SignedIn>

          <SignedOut>
            <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10">
              <section className="glass-panel w-full p-6 md:p-8">
                <div className="mb-6">
                  <p className="text-lg font-semibold">Imago Podcasting</p>
                  <p className="text-sm text-muted-foreground">Search your archive by meaning</p>
                </div>
                <div className="page-transition">{children}</div>
              </section>
            </div>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
