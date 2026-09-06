"use client";

import { ArrowUpRight, Menu } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  ["Work", "/#work"],
  ["Services", "/services"],
  ["Studio", "/studio"],
  ["Platform", "/platform"],
  ["Markets", "/industries"],
  ["Agency", "/about"],
];

export function BrandLockup({ footer = false }: { footer?: boolean }) {
  return (
    <Link className={`brand-lockup${footer ? " footer-brand" : ""}`} href="/" aria-label="KINGXFORD Agency home">
      <span className="brand-mark" aria-hidden="true"><i>K</i></span>
      <span>KINGXFORD<small>AGENCY</small></span>
    </Link>
  );
}

export function SiteNav() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="nav-shell" role="banner">
        <BrandLockup />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <a className="nav-cta desktop-project" href="/platform">Open workspace <ArrowUpRight size={15} /></a>
        <Sheet>
          <SheetTrigger asChild>
            <button className="mobile-menu" aria-label="Open menu"><Menu /></button>
          </SheetTrigger>
          <SheetContent className="mobile-sheet" aria-describedby="mobile-menu-description">
            <SheetHeader className="mobile-sheet-head">
              <SheetTitle><BrandLockup /></SheetTitle>
              <SheetDescription id="mobile-menu-description">Explore KINGXFORD Agency</SheetDescription>
            </SheetHeader>
            <nav className="mobile-links" aria-label="Mobile navigation">
              {links.map(([label, href], index) => (
                <SheetClose asChild key={href}><a href={href}><span>{String(index + 1).padStart(2,"0")}</span>{label}<ArrowUpRight /></a></SheetClose>
              ))}
            </nav>
            <div className="mobile-sheet-foot">
              <a className="button button-coral" href="/start">Start with the outcome <ArrowUpRight /></a>
              <span>St. John&apos;s · Newfoundland & Labrador · Canada</span>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
