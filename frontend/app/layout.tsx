/** Persistent navigation for the disclosure research desk and document library. */
import type { Metadata } from "next";
import Link from "next/link";
import { ChartNoAxesCombined, Bookmark } from "lucide-react";
import "./globals.css";
export const metadata: Metadata = {
  title: "Disclosure Desk | Cross-market research",
  description:
    "Search and compare US and Indian corporate disclosures with cited evidence.",
};
const links = [
  ["/", "Search"],
  ["/library", "Library"],
  ["/compare", "Compare"],
  ["/risks", "Risks"],
  ["/chat", "Chat"],
  ["/benchmark", "Benchmark"],
];
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <header className="shell">
          <div className="shell-inner">
            <Link href="/" className="brand">
              <ChartNoAxesCombined size={26} /> Disclosure Desk
            </Link>
            <nav aria-label="Main navigation">
              {links.map(([href, name]) => (
                <Link key={href} href={href}>
                  {name}
                </Link>
              ))}
            </nav>
            <Link href="/brief" className="brief-nav">
              <Bookmark size={15} /> My brief
            </Link>
          </div>
        </header>
        <main id="content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="desk-footer">
          <span>Cross-Market Disclosure Analysis</span>
          <Link href="/research/coverage">Research corpus ↗</Link>
        </footer>
      </body>
    </html>
  );
}
