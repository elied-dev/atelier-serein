import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
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
        <header><Link href="/" className="inline-flex min-h-11 items-center">{site.name}</Link></header>
        <main>{children}</main>
        <footer><p>{site.demoNotice}</p><Link href="/credits" className="inline-flex min-h-11 items-center">Image credits</Link></footer>
      </body>
    </html>
  );
}
