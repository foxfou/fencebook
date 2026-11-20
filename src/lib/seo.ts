import type { Metadata } from "next";
import { locales } from "./i18n";
import { BRAND } from "./site";
import type { Locale } from "./types";

/** Open Graph and Twitter tags for a page. The brand goes to siteName, so the title stays short.
 *  `image` is the path of the page's og.png route. */
export function shareTags(opts: {
  locale: Locale;
  title: string;
  description?: string;
  path: string;
  image: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = { url: opts.image, width: 1200, height: 630, alt: opts.title, type: "image/png" };
  return {
    openGraph: {
      type: "website",
      siteName: BRAND,
      title: opts.title,
      description: opts.description,
      url: opts.path,
      locale: opts.locale === "ru" ? "ru_RU" : "en_US",
      alternateLocale: opts.locale === "ru" ? ["en_US"] : ["ru_RU"],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [opts.image],
    },
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
