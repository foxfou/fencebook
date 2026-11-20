import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItemBrowser } from "@/components/ItemBrowser";
import { toListItems } from "@/lib/catalog";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { openGraph } from "@/lib/seo";
import { BRAND, GAME } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  // The title template from the layout does not apply to page.tsx in the same segment, so the title is set here.
  const heading = locale === "ru" ? `${t.catalog.title} ${GAME}` : `${GAME} ${t.catalog.title}`;
  return {
    title: { absolute: `${heading} · ${BRAND}` },
    description: t.catalog.lead,
    openGraph: openGraph({ locale, title: heading, description: t.catalog.lead, path: `/${locale}` }),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <h1 className="display text-4xl">{t.catalog.title}</h1>
      <p className="mt-1 max-w-3xl text-ink-2">{t.catalog.lead}</p>
      <div className="mt-6">
        <ItemBrowser
          items={toListItems(locale)}
          locale={locale}
          t={t.catalog}
          categories={t.categories}
          rarities={t.rarities}
        />
      </div>
    </div>
  );
}
