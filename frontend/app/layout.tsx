import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { LineChart, LayoutGrid, MessageSquareText, Target } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Cross-Market Disclosure Analysis",
  description: "US vs India corporate disclosure sentiment & risk dashboard (pilot).",
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/benchmark", label: "Benchmark", icon: Target },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                <LineChart className="h-4.5 w-4.5" strokeWidth={2.25} />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight text-slate-900">
                  Cross-Market Disclosure Analysis
                </span>
                <span className="text-[11px] font-medium text-slate-400">US · India pilot</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 p-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-indigo-600 hover:shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>

        <footer className="mt-8 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <p className="text-xs leading-relaxed text-slate-500">
              <span className="font-medium text-slate-600">
                Research/educational purposes only — not investment advice.
              </span>{" "}
              Pilot scope: 5 sector-matched US/India company pairs, single quarter, single model
              tier. See{" "}
              <Link href="/benchmark" className="text-indigo-600 hover:underline">
                benchmark results
              </Link>{" "}
              and the project report for full methodology and limitations.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
