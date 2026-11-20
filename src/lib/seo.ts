import type { Metadata } from "next";
import { locales } from "./i18n";
import { BRAND } from "./site";
import type { Locale } from "./types";

/** Open Graph for a page. The brand goes to siteName, so the title stays short. Images come from opengraph-image files. */
export function openGraph(opts: {
  locale: Locale;
  title: string;
  description?: string;
  path: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: BRAND,
    title: opts.title,
    description: opts.description,
    url: opts.path,
    locale: opts.locale === "ru" ? "ru_RU" : "en_US",
    alternateLocale: opts.locale === "ru" ? ["en_US"] : ["ru_RU"],
  };
}

/** canonical + hreflang for a path without the language prefix ("" or "/items/<id>"). Russian is the default. */
export function alternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/ru${path}`,
    },
  };
}

/** Cuts a text to about `max` characters on a word boundary. */
export function clip(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.:;—-]+$/, "") + "…";
}
