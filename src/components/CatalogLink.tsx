"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { lastQuery } from "@/lib/catalogFilters";

const noop = () => () => {};

/** Link to the item catalog with the filters the visitor last used in this tab (see catalogFilters.ts). */
export function CatalogLink({ locale, className, children }: { locale: string; className?: string; children: ReactNode }) {
  // The static page links to the plain catalog; the browser adds the saved filters right after loading.
  const query = useSyncExternalStore(noop, lastQuery, () => "");
  return (
    <Link href={`/${locale}/items${query ? `?${query}` : ""}`} className={className}>
      {children}
    </Link>
  );
}
