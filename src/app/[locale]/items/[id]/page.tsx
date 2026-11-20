import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { itemDescription, itemName, items, itemsById } from "@/lib/catalog";
import { money } from "@/lib/format";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { openGraph } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => items.map((i) => ({ locale, id: i.id })));
}

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const item = itemsById.get(id);
  if (!isLocale(locale) || !item) return {};
  const title = itemName(item, locale);
  const description = itemDescription(item, locale) || undefined;
  return {
    title,
    description,
    openGraph: openGraph({ locale, title, description, path: `/${locale}/items/${id}` }),
    alternates: {
      canonical: `/${locale}/items/${id}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/items/${id}`])),
    },
  };
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default async function ItemPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const item = itemsById.get(id);
  if (!item) notFound();

  const t = getDict(locale);
  const [w, h] = item.size ?? [1, 1];
  const rarity = item.rarity ?? 0;
  const name = itemName(item, locale);
  const desc = itemDescription(item, locale);
  const none = <span className="text-ink-3">{t.item.noData}</span>;
  const others = Object.entries(item.names).filter(([l, n]) => n && l !== locale);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <Link href={`/${locale}`} className="text-sm text-ink-2 hover:text-accent">
        ← {t.item.back}
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[auto_1fr]">
        <div
          className="tile tile-solo"
          style={{ "--w": w, "--h": h, "--r": `var(--color-r${rarity})` } as CSSProperties}
        >
          {item.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/icons/${item.id}.png`} alt={name} />
          )}
        </div>

        <div>
          <h1 className="display text-4xl">{name}</h1>
          <p className="mt-1 text-sm" style={{ color: `var(--color-r${rarity})` }}>
            {t.rarities[String(rarity)]}
          </p>
          {desc && <p className="mt-4 max-w-2xl text-ink-2">{desc}</p>}

          {item.missing.length > 0 && (
            <p className="mt-4 rounded border border-line-2 bg-surface px-3 py-2 text-sm text-ink-2">
              {t.item.incomplete}
            </p>
          )}

          <dl className="mt-6 max-w-xl">
            <Row label={t.item.category}>{item.category ? (t.categories[item.category] ?? item.category) : none}</Row>
            {item.type && <Row label={t.item.type}>{item.type}</Row>}
            <Row label={t.item.size}>
              {item.size ? `${w} × ${h} (${item.slots} ${t.item.slots})` : none}
            </Row>
            <Row label={t.item.sell}>
              {item.sell !== null ? (
                <>
                  <span className="display text-lg text-accent">{money(item.sell, locale)}</span>
                  <span className="block text-xs text-ink-3">{t.item.baseNote}</span>
                </>
              ) : (
                none
              )}
            </Row>
            <Row label={t.item.perSlot}>{item.value_per_slot !== null ? money(item.value_per_slot, locale) : none}</Row>
            {item.buy !== null && <Row label={t.item.buy}>{money(item.buy, locale)}</Row>}
            {item.shipment_research !== null && (
              <Row label={t.item.research}>{money(item.shipment_research, locale)}</Row>
            )}
            {item.purchase_from && <Row label={t.item.purchaseFrom}>{item.purchase_from}</Row>}
            {item.loot_spot && (
              <Row label={t.item.lootSpot}>
                {item.loot_spot}
                {item.loot_spot_count ? ` · ${item.loot_spot_count} ${t.item.spots}` : ""}
              </Row>
            )}
            {item.stack !== null && <Row label={t.item.stack}>{item.stack}</Row>}
            <Row label="ID">
              <code className="text-ink-2">{item.id}</code>
            </Row>
          </dl>

          {others.length > 0 && (
            <section className="mt-6 max-w-xl">
              <h2 className="display mb-2 text-sm text-ink-3">{t.item.otherNames}</h2>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-ink-2">
                {others.map(([l, n]) => (
                  <li key={l}>
                    <span className="mr-2 uppercase text-ink-3">{l}</span>
                    {n}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
