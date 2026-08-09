import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cross-Market Disclosure Analysis",
  description: "US vs India corporate disclosure sentiment & risk dashboard (pilot).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              Cross-Market Disclosure Analysis
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/chat" className="hover:underline">
                Chat
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
          Research/educational purposes only — not investment advice. Pilot scope: 5
          sector-matched US/India company pairs, single quarter, single model tier.
        </footer>
      </body>
    </html>
  );
}
