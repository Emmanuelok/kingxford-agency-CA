"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/industries", label: "Industries" },
  { href: "/approach", label: "Approach" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.dataset.menuOpen = open ? "true" : "false";
    const background = [
      document.querySelector<HTMLElement>(".skip-link"),
      document.getElementById("main-content"),
      document.querySelector<HTMLElement>("footer"),
    ].filter((element): element is HTMLElement => Boolean(element));
    background.forEach((element) => {
      element.inert = open;
    });
    return () => {
      delete document.body.dataset.menuOpen;
      background.forEach((element) => {
        element.inert = false;
      });
    };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1121px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeAtDesktop);
    return () => desktop.removeEventListener("change", closeAtDesktop);
  }, []);

  function toggleMenu() {
    setOpen((current) => {
      const next = !current;
      if (next) {
        window.requestAnimationFrame(() => {
          menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        });
      }
      return next;
    });
  }

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? [],
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <header className="site-header">
      <div className="site-header__inner" inert={open}>
        <BrandMark />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              className={pathname.startsWith(item.href) ? "is-active" : undefined}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="header-cta" href="/start-a-project">
          Start a project
          <span aria-hidden="true">↗</span>
        </Link>
        <button
          aria-controls="mobile-menu"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="menu-button"
          onClick={toggleMenu}
          ref={menuButtonRef}
          type="button"
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <div
        aria-label="Site navigation"
        aria-modal="true"
        className={`mobile-menu ${open ? "is-open" : ""}`}
        id="mobile-menu"
        inert={!open}
        onKeyDown={handleMenuKeyDown}
        ref={menuRef}
        role="dialog"
      >
        <button
          aria-label="Close navigation"
          className="mobile-menu__close"
          onClick={() => closeMenu(true)}
          type="button"
        >
          Close <X aria-hidden="true" />
        </button>
        <nav aria-label="Mobile navigation">
          {navItems.map((item, index) => (
            <Link
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              href={item.href}
              key={item.href}
              onClick={() => closeMenu()}
            >
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
          <Link className="mobile-menu__cta" href="/start-a-project" onClick={() => closeMenu()}>
            Start a project <span aria-hidden="true">↗</span>
          </Link>
        </nav>
        <p>Independent in St. John’s. Built to travel.</p>
      </div>
    </header>
  );
}
