import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { BagProvider } from "@/components/bag-provider";
import { site } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.positioning,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <BagProvider>
          <header className="site-header">
            <Link href="/" className="wordmark">{site.name}</Link>
            <nav aria-label="Primary navigation">
              <Link href="/#collections">Collections</Link>
              <Link href="/#featured">The edit</Link>
              <Link href="/#craft">Craft</Link>
            </nav>
            <span className="demo-label">Fictional maison</span>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <Link href="/" className="wordmark">{site.name}</Link>
            <p>{site.demoNotice}</p>
            <p>© 2026 · Demo only</p>
          </footer>
        </BagProvider>
      </body>
    </html>
  );
}
