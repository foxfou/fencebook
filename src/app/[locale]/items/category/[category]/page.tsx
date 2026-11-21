import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryNav } from "@/components/CategoryNav";
import { ItemBrowser } from "@/components/ItemBrowser";
import { PAGE_CONTAINER } from "@/components/PageHeader";
import { categoryIds, categoryPath, itemName, itemPath, itemsInCategory, toListItems } from "@/lib/catalog";
import { money } from "@/lib/format";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { leaders } from "@/lib/ranks";
import { alternates, shareTags } from "@/lib/seo";
import { BRAND } from "@/lib/site";

// A page per item category (/ru/items/category/weapons): its own title and text for searches like "ROB RUN weapons",
// and a level between the catalog and the item in the breadcrumbs.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => categoryIds.map((category) => ({ locale, category })));
}

type Params = Promise<{ locale: string; category: string }>;

function prices(list: ReturnType<typeof itemsInCategory>) {
  const sells = list.map((i) => i.sell).filter((s): s is number => s !== null);
  return sells.length ? { min: Math.min(...sells), max: Math.max(...sells) } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isLocale(locale) || !categoryIds.includes(category)) return {};
  const t = getDict(locale);
  const name = t.categories[category] ?? category;
  const list = itemsInCategory(category);
  const range = prices(list);
  const title = t.seo.categoryTitle(name);
  const description = t.seo.categoryDescription(
    name,
    list.length,
    range ? money(range.min, locale) : null,
    range ? money(range.max, locale) : null,
  );
  return {
    // The title template from the layout does not apply to page.tsx in the same segment, so the full title is set here.
    title: { absolute: `${title} | ${BRAND}` },
    description,
    ...shareTags({
      locale,
      title,
      description,
      path: `/${locale}${categoryPath(category)}`,
      image: `/${locale}/items/og.png`,
    }),
    alternates: alternates(locale, categoryPath(category)),
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { locale, category } = await params;
  if (!isLocale(locale) || !categoryIds.includes(category)) notFound();
  const t = getDict(locale);
  const name = t.categories[category] ?? category;
  const list = itemsInCategory(category);
  const { top, bestSlot } = leaders(list);
  const tc = t.category;

  return (
    <div className={PAGE_CONTAINER}>
      <Breadcrumbs
        locale={locale}
        crumbs={[
          { name: t.item.home, href: `/${locale}` },
          { name: t.nav.items, href: `/${locale}/items`, catalog: true },
          { name, href: `/${locale}${categoryPath(category)}` },
        ]}
      />

      <h1 className="display mt-4 text-4xl">{tc.title(name)}</h1>
      {/* A short text made from the data: how many items, the most expensive one and the best value per slot. */}
      <p className="mt-2 max-w-3xl text-ink-2">
        {tc.count(name, list.length)}
        {top && top.sell !== null && (
          <>
            {" "}
            {tc.mostExpensive}{" "}
            <Link href={`/${locale}${itemPath(top)}`} className="text-ink hover:text-accent">
              {itemName(top, locale)}
            </Link>{" "}
            ({money(top.sell, locale)})
            {bestSlot && bestSlot.value_per_slot !== null && bestSlot.id !== top.id ? "," : "."}
          </>
        )}
        {bestSlot && bestSlot.value_per_slot !== null && bestSlot.id !== top?.id && (
          <>
            {" "}
            {tc.bestPerSlot}{" "}
            <Link href={`/${locale}${itemPath(bestSlot)}`} className="text-ink hover:text-accent">
              {itemName(bestSlot, locale)}
            </Link>{" "}
            ({money(bestSlot.value_per_slot, locale)} {tc.perSlot}).
          </>
        )}
      </p>

      <div className="mt-5 lg:hidden">
        <CategoryNav
          locale={locale}
          label={t.catalog.categoriesNav}
          allLabel={t.catalog.allCategories}
          names={t.categories}
          current={category}
        />
      </div>

      <div className="mt-6">
        <ItemBrowser
          items={toListItems(locale, list)}
          locale={locale}
          t={t.catalog}
          rarities={t.rarities}
          rememberQuery={false}
          categoryNav={
            <CategoryNav
              locale={locale}
              label={t.catalog.categoriesNav}
              allLabel={t.catalog.allCategories}
              names={t.categories}
              current={category}
              variant="list"
            />
          }
        />
      </div>
    </div>
  );
}
