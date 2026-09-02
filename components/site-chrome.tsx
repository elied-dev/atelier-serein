"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useBag } from "@/components/bag-provider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { site } from "@/lib/site";

const navigation = [
  ["Collection", "/collection"],
  ["Bags", "/collection/bags"],
  ["Jewelry", "/collection/jewelry"],
  ["Watches", "/collection/watches"],
  ["Fragrance", "/collection/fragrance"],
] as const;

export function SiteHeader() {
  const { count } = useBag();

  return (
    <header className="site-header">
      <Link href="/" className="wordmark">{site.name}</Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <Link href="/bag" className="bag-link" aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}>
          Bag ({count})
        </Link>
        <Sheet>
          <SheetTrigger className="mobile-nav-trigger" aria-label="Open navigation">
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent className="mobile-nav-sheet">
            <SheetHeader>
              <SheetTitle>{site.name}</SheetTitle>
              <SheetDescription>Browse the fictional collection.</SheetDescription>
            </SheetHeader>
            <nav aria-label="Mobile navigation">
              {navigation.map(([label, href]) => (
                <SheetClose render={<Link href={href} />} key={href}>{label}</SheetClose>
              ))}
              <SheetClose
                render={<Link href="/bag" aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`} />}
              >
                Bag ({count})
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/" className="wordmark">{site.name}</Link>
      <p>{site.demoNotice}</p>
      <nav aria-label="Footer navigation">
        <Link href="/collection">Collection</Link>
      </nav>
    </footer>
  );
}
