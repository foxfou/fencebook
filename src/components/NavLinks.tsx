"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dict } from "@/lib/i18n";

/** Main navigation. The active section is lime, like the game's buttons. */
export function NavLinks({ locale, t }: { locale: string; t: Dict["nav"] }) {
  const pathname = usePathname() || "/";
  const onShipments = pathname.startsWith(`/${locale}/shipments`);
  const links = [
    { href: `/${locale}`, label: t.items, active: !onShipments },
    { href: `/${locale}/shipments`, label: t.shipments, active: onShipments },
  ];
  return (
    <nav className="ml-4 flex gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.active ? "page" : undefined}
          className={`skew px-4 py-1.5 ${l.active ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink-2 hover:text-ink"}`}
        >
          <span className="display text-lg">{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
