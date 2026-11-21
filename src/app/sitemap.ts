import type { MetadataRoute } from "next";
import { categoryIds, categoryPath, itemPath, items, manifest } from "@/lib/catalog";
import { locales } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

// Static export: route handlers must be marked static explicitly.
export const dynamic = "force-static";

/** All language versions of a path, plus x-default (Russian). */
function languages(path: string) {
  return {
    ...Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
    "x-default": `${siteUrl}/ru${path}`,
  };
}

// The date of the data: when Steam updated the game to the build the catalog comes from. Search engines use it
// to recrawl after a patch. Without it (an old manifest) the field is left out rather than set to the build time.
const lastModified = manifest.game.lastupdated ? new Date(manifest.game.lastupdated * 1000) : undefined;

/** One entry per language for a path without the language prefix. */
function entries(path: string, priority: number): MetadataRoute.Sitemap {
  return locales.map((l) => ({
    url: `${siteUrl}/${l}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "weekly" as const,
    priority,
    alternates: { languages: languages(path) },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...entries("", 1),
    ...entries("/items", 0.9),
    ...entries("/shipments", 0.9),
    ...categoryIds.flatMap((c) => entries(categoryPath(c), 0.8)),
    ...items.flatMap((i) => entries(itemPath(i), 0.7)),
  ];
}
