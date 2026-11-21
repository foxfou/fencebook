import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/CategoryNav";
import { Faq } from "@/components/Faq";
import { ItemBrowser } from "@/components/ItemBrowser";
import { PAGE_CONTAINER, PageHeader } from "@/components/PageHeader";
import { items, manifest, toListItems } from "@/lib/catalog";
import { getDict, isLocale } from "@/lib/i18n";
import { alternates, shareTags } from "@/lib/seo";
import { BRAND } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    // The title template from the layout does not apply to page.tsx in the same segment, so the full title is set here.
    title: { absolute: `${t.seo.catalogTitle} | ${BRAND}` },
    description: t.seo.catalogDescription(items.length),
    ...shareTags({
      locale,
      title: t.seo.catalogTitle,
      description: t.seo.catalogShare,
      path: `/${locale}/items`,
      image: `/${locale}/items/og.png`,
    }),
    alternates: alternates(locale, "/items"),
  };
}

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <div className={PAGE_CONTAINER}>
      <PageHeader title={t.catalog.title} lead={t.catalog.lead} />
      <div className="mt-5 lg:hidden">
        <CategoryNav locale={locale} label={t.catalog.categoriesNav} allLabel={t.catalog.allCategories} names={t.categories} />
      </div>
      <div className="mt-6">
        <ItemBrowser
          items={toListItems(locale)}
          locale={locale}
          t={t.catalog}
          rarities={t.rarities}
          categoryNav={
            <CategoryNav
              locale={locale}
              label={t.catalog.categoriesNav}
              allLabel={t.catalog.allCategories}
              names={t.categories}
              variant="list"
            />
          }
        />
      </div>
      <Faq title={t.faq.title} items={t.faq.items(manifest.game.buildid)} />
    </div>
  );
}
