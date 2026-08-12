import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Cross-Market Disclosure Analysis",
  description: "US vs India corporate disclosure sentiment and risk dashboard.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0B0B0B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand-lockup" aria-label="Cross-Market Disclosure Analysis home">
              <Image className="brand-logo" src="/brand-logo.png" alt="" width={38} height={38} priority />
              <span className="brand-name">Cross-Market</span>
              <span className="brand-tag">Disclosure analysis</span>
            </Link>
            <SiteNav />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="footer-bottom page-container"><span>(c) 2026 Cross-Market Disclosure Analysis</span><span>Research / educational use only</span></div>
        </footer>
      </body>
    </html>
  );
}
