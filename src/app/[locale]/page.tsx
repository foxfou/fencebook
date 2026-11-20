import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItemBrowser } from "@/components/ItemBrowser";
import { items, toListItems } from "@/lib/catalog";
import { getDict, isLocale } from "@/lib/i18n";
import { alternates, openGraph } from "@/lib/seo";
import { BRAND } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    // The title template from the layout does not apply to page.tsx in the same segment, so the full title is set here.
    title: { absolute: `${t.seo.catalogTitle} | ${BRAND}` },
    description: t.seo.catalogDescription(items.length),
    openGraph: openGraph({ locale, title: t.seo.catalogTitle, description: t.seo.catalogShare, path: `/${locale}` }),
    alternates: alternates(locale, ""),
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
