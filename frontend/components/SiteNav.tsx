"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/compare", label: "Compare" },
  { href: "/risks", label: "Risks" },
  { href: "/chat", label: "Chat" },
  { href: "/benchmark", label: "Benchmark" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="main-nav" aria-label="Primary navigation">
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-expanded={open}
        aria-controls="primary-nav-links"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <div id="primary-nav-links" className="nav-links" data-open={open ? "true" : "false"}>
        {NAV_ITEMS.map(({ href, label }) => {
          const active = href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
