"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales } from "@/lib/i18n";

/** Language switch: replaces the first path segment and keeps the rest. */
export function LocaleSwitch({ locale }: { locale: string }) {
  const pathname = usePathname() || "/";
  const rest = pathname.split("/").slice(2).join("/");
  return (
    <div className="flex gap-1" role="group" aria-label="Language">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ""}`}
          aria-current={l === locale ? "true" : undefined}
          className={`skew px-3 py-1 text-sm ${
            l === locale ? "bg-surface-2 text-accent" : "text-ink-2 hover:text-ink"
          }`}
        >
          <span className="display">{l}</span>
        </Link>
      ))}
    </div>
  );
}
