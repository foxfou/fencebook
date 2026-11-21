import type { MetadataRoute } from "next";
import { items } from "@/lib/catalog";
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

export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = locales.map((l) => ({
    url: `${siteUrl}/${l}`,
    changeFrequency: "weekly" as const,
    priority: 1,
    alternates: { languages: languages("") },
  }));
  const shipments = locales.map((l) => ({
    url: `${siteUrl}/${l}/shipments`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
    alternates: { languages: languages("/shipments") },
  }));
  const pages = items.flatMap((i) =>
    locales.map((l) => ({
      url: `${siteUrl}/${l}/items/${i.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: { languages: languages(`/items/${i.id}`) },
    })),
  );
  return [...catalog, ...shipments, ...pages];
}
