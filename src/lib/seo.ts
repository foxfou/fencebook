import type { Metadata } from "next";
import { BRAND } from "./site";
import type { Locale } from "./types";

/** Open Graph for a page: brand name, page title, description, language. */
export function openGraph(opts: {
  locale: Locale;
  title: string;
  description?: string;
  path: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: BRAND,
    title: `${opts.title} · ${BRAND}`,
    description: opts.description,
    url: opts.path,
    locale: opts.locale === "ru" ? "ru_RU" : "en_US",
  };
}
