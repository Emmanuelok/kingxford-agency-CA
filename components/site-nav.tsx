"use client";

import { ArrowUpRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORKSPACE_ENABLED } from "@/lib/release";
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
  ["Services", "/services"],
  ["Solutions", "/solutions"],
  ["Work", "/projects"],
  ["Print", "/print"],
  ...(WORKSPACE_ENABLED ? [["Studio", "/studio"]] : []),
  ["About", "/about"],
];

export function BrandLockup({ footer = false }: { footer?: boolean }) {
  return (
    <Link className={`brand-lockup${footer ? " footer-brand" : ""}`} href="/" aria-label="AVALON Creative Group home">
      <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M7 31 20 7l13 24H7Z" stroke="currentColor" strokeWidth="2.4"/><path d="m13.5 26 6.5-12 6.5 12h-13Z" fill="currentColor"/><path d="M20 27v8" stroke="currentColor" strokeWidth="2.4"/></svg></span>
      <span>AVALON<small>CREATIVE GROUP</small></span>
    </Link>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="nav-shell avalon-nav" role="banner">
        <BrandLockup />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => href === "/print" ? <a key={href} href={href}>{label}</a> : <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
        </nav>
        <Link className="nav-cta desktop-project" href={WORKSPACE_ENABLED ? "/platform" : "/start"}>{WORKSPACE_ENABLED ? "The workspace" : "Start a project"} <ArrowUpRight size={17} /></Link>
        <Sheet>
          <SheetTrigger asChild>
            <button className="mobile-menu" aria-label="Open menu"><Menu /></button>
          </SheetTrigger>
          <SheetContent className="mobile-sheet" aria-describedby="mobile-menu-description">
            <SheetHeader className="mobile-sheet-head">
              <SheetTitle><BrandLockup /></SheetTitle>
              <SheetDescription id="mobile-menu-description">Explore AVALON Creative Group</SheetDescription>
            </SheetHeader>
            <nav className="mobile-links" aria-label="Mobile navigation">
              {links.map(([label, href], index) => (
                <SheetClose asChild key={href}><a href={href} aria-current={pathname === href ? "page" : undefined}><span>{String(index + 1).padStart(2,"0")}</span>{label}<ArrowUpRight /></a></SheetClose>
              ))}
            </nav>
            <div className="mobile-sheet-foot">
              <a className="button button-coral" href="/start">Start with the outcome <ArrowUpRight /></a>
              <a className="mobile-workspace-link" href={WORKSPACE_ENABLED ? "/platform" : "/projects"}>{WORKSPACE_ENABLED ? "Open your workspace" : "Explore completed projects"} <ArrowUpRight size={18} /></a>
              <span>Independent thinking. Connected delivery. Canada.</span>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
