import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ItemCard } from "@/components/ItemCard";
import { PAGE_CONTAINER } from "@/components/PageHeader";
import { categoryPath, itemDescription, itemName, itemPath, items, itemsBySlug, itemSlug } from "@/lib/catalog";
import { money } from "@/lib/format";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { itemOverview } from "@/lib/overviews";
import { parsePurchase } from "@/lib/purchase";
import { categoryRanks } from "@/lib/ranks";
import { alternates, clip, shareTags } from "@/lib/seo";
import { iconSrc } from "@/lib/icons";
import { computePlan } from "@/lib/shipments";
import { shipmentsData, shipmentsGraph } from "@/lib/shipmentsData";
import { similarItems } from "@/lib/similar";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => items.map((i) => ({ locale, slug: itemSlug(i) })));
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = itemsBySlug.get(slug);
  if (!isLocale(locale) || !item) return {};
  const path = itemPath(item);
  const t = getDict(locale);
  const name = itemName(item, locale);
  const title = t.seo.itemTitle(
    name,
    item.sell !== null ? money(item.sell, locale) : null,
    item.size ? `${item.size[0]}×${item.size[1]}` : null,
  );
  const lead = t.seo.itemLead(
    name,
    item.sell !== null ? money(item.sell, locale) : null,
    item.size ? `${item.size[0]}×${item.size[1]}` : null,
    item.rarity !== null ? (t.rarities[String(item.rarity)] ?? null) : null,
  );
  const desc = itemDescription(item, locale);
  return {
    title,
    description: clip(desc ? `${lead} ${desc}` : lead, 160),
    ...shareTags({
      locale,
      title,
      description: clip(lead, 200),
      path: `/${locale}${path}`,
      image: `/${locale}${path}/og.png`,
    }),
    alternates: alternates(locale, path),
  };
}

/** Every section of the page has the same heading, so the blocks line up and read as one page. */
const H2 = "display mb-3 text-lg leading-none";
const PANEL = "rounded-md border border-line bg-surface";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Stat({ label, hint, children, sub }: { label: string; hint?: string; children: ReactNode; sub?: string }) {
  return (
    <div className="stat min-w-0">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-3">
        {label}
        {hint && (
          <span
            title={hint}
            aria-label={hint}
            className="inline-flex size-4 cursor-help items-center justify-center rounded-full border border-line-2 text-[10px] normal-case"
          >
            ?
          </span>
        )}
      </div>
      <div className="mt-1.5">{children}</div>
      {sub && <div className="mt-0.5 text-sm text-ink-2">{sub}</div>}
    </div>
  );
}

export default async function ItemPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const item = itemsBySlug.get(slug);
  if (!item) notFound();

  const t = getDict(locale);
  const [w, h] = item.size ?? [1, 1];
  const rarity = item.rarity ?? 0;
  const rarityColor = `var(--color-r${rarity})`;
  const name = itemName(item, locale);
  const desc = itemDescription(item, locale);
  const none = <span className="text-ink-3">{t.item.noData}</span>;
  const others = Object.entries(item.names).filter(([l, n]) => n && l !== locale);
  const category = item.category ? (t.categories[item.category] ?? item.category) : null;
  const categoryHref = item.category ? `/${locale}${categoryPath(item.category)}` : null;
  const typeName = item.type ? (t.types[item.type] ?? item.type) : null;

  // The shipment that unlocks this item, if there is one, and what the whole path to it takes.
  const shipment = shipmentsData.nodes.find((n) => n.item === item.id) ?? null;
  const path = shipment ? computePlan(shipmentsGraph, [shipment.id]) : null;
  // The Black Market price is in the shipment card; a separate "buy price" tile only when it says something else.
  const blackMarketPrice = shipment?.buy ?? null;
  const showBuy = item.buy !== null && item.buy !== blackMarketPrice;

  // "Where to buy" in the page language: the source, its conditions and, for the Black Market, the price.
  const tp = t.purchase;
  const purchase = parsePurchase(item.purchase_from).map((p) => {
    if (p.kind === "blackMarket") {
      const notes = [shipment ? tp.afterShipment : null, p.tier ? tp.settlement.replace("{n}", String(p.tier)) : null].filter(
        Boolean,
      );
      return {
        title: tp.blackMarket,
        tag: null,
        note: notes.length ? notes.join(", ") : tp.noConditions,
        price: blackMarketPrice ?? item.buy,
      };
    }
    if (p.kind === "shop") {
      const notes = [
        p.priceFactor ? tp.priceFactor.replace("{n}", String(p.priceFactor)) : null,
        p.civiliansOnly ? tp.civiliansOnly : null,
      ].filter(Boolean);
      return { title: tp.shops[p.shop] ?? p.shop, tag: tp.inRaid, note: notes.join(" · "), price: null };
    }
    return { title: p.text, tag: null, note: "", price: null };
  });

  const hasBlackMarket = purchase.some((p) => p.title === tp.blackMarket);

  const stats = [
    <Stat key="sell" label={t.item.sell} hint={item.sell !== null ? t.item.baseNote : undefined}>
      {item.sell !== null ? <span className="display text-3xl leading-none text-accent">{money(item.sell, locale)}</span> : none}
    </Stat>,
    <Stat key="slot" label={t.item.perSlot}>
      {item.value_per_slot !== null ? (
        <span className="display text-2xl leading-none">{money(item.value_per_slot, locale)}</span>
      ) : (
        none
      )}
    </Stat>,
    <Stat key="size" label={t.item.size} sub={item.size && item.slots ? t.item.slotsTotal(item.slots) : undefined}>
      {item.size ? <span className="display text-2xl leading-none">{`${w} × ${h}`}</span> : none}
    </Stat>,
    showBuy ? (
      <Stat key="buy" label={t.item.buy}>
        <span className="display text-2xl leading-none">{money(item.buy, locale)}</span>
      </Stat>
    ) : null,
  ].filter(Boolean);

  const similar = similarItems(item, items).map((i) => ({
    href: `/${locale}${itemPath(i)}`,
    id: i.id,
    name: itemName(i, locale),
    rarity: i.rarity ?? 0,
    rarityLabel: t.rarities[String(i.rarity ?? 0)] ?? "",
    sell: i.sell,
    hasIcon: Boolean(i.icon),
  }));

  // The hand-written overview when there is one in this language (data/overviews), otherwise
  // a short text made from the data, so every item page has its own words, not only the line from the game.
  const ranks = categoryRanks(item, items);
  const overview = itemOverview(item.id, locale) ?? t.item.summary({
    name,
    rarity: rarity ? (t.rarities[String(rarity)] ?? null) : null,
    category,
    price: item.sell !== null ? money(item.sell, locale) : null,
    perSlot: item.value_per_slot !== null && (item.slots ?? 1) > 1 ? money(item.value_per_slot, locale) : null,
    size: item.size ? `${w}×${h}` : null,
    slotRank: ranks.slotRank,
    n: ranks.n,
    shipment: Boolean(shipment),
    research: shipment && shipment.cost > 0 ? money(shipment.cost, locale) : null,
    pathTotal: shipment && path && path.total !== shipment.cost ? money(path.total, locale) : null,
  });

  const overviewBlock = (
    <section>
      <h2 className={H2}>{t.item.overview}</h2>
      <p className="text-ink-2">{overview}</p>
    </section>
  );

  const purchaseBlock = purchase.length > 0 && (
    <section>
      <h2 className={H2}>{t.item.purchaseFrom}</h2>
      <ul className={`${PANEL} divide-y divide-line`}>
        {purchase.map((p) => (
          <li key={p.title} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span>{p.title}</span>
                {p.tag && <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">{p.tag}</span>}
              </div>
              {p.note && <div className="mt-0.5 text-sm text-ink-2">{p.note}</div>}
            </div>
            {p.price !== null && <span className="display shrink-0 text-lg">{money(p.price, locale)}</span>}
          </li>
        ))}
      </ul>
    </section>
  );

  const detailsBlock = (
    <section>
      <h2 className={H2}>{t.item.details}</h2>
      <dl className={`${PANEL} px-4`}>
        {item.loot_spot && (
          <Row label={t.item.lootSpot}>
            {t.lootSpots[item.loot_spot] ?? item.loot_spot}
            {item.loot_spot_count ? ` · ${item.loot_spot_count} ${t.item.spots}` : ""}
          </Row>
        )}
        {item.stack !== null && <Row label={t.item.stack}>{item.stack}</Row>}
        {!shipment && item.shipment_research !== null && (
          <Row label={t.item.research}>{money(item.shipment_research, locale)}</Row>
        )}
        <Row label={t.item.gameId}>
          <code className="text-ink-2">{item.id}</code>
        </Row>
      </dl>
      {/* Names in the other languages: small print, mostly for search engines. */}
      {others.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-ink-3">
          <span className="mr-1">{t.item.otherNames}:</span>
          {others.map(([l, n], k) => (
            <span key={l}>
              {k > 0 && " · "}
              <span className="uppercase">{l}</span>{" "}
              <span lang={l} className="text-ink-2">
                {n}
              </span>
            </span>
          ))}
        </p>
      )}
    </section>
  );

  const shipmentBlock = shipment && path && (
    <section>
      <h2 className={H2}>{t.item.shipmentTitle}</h2>
      <div className={`${PANEL} p-4`}>
        <p className="text-sm text-ink-2">{t.item.shipmentLead}</p>
        <dl className="mt-2">
          <Row label={t.item.shipmentBranch}>{t.shipments.categories[shipment.category] ?? shipment.category}</Row>
          <Row label={t.shipments.research}>
            <span className="display text-lg text-accent">
              {shipment.cost === 0 ? t.shipments.free : money(shipment.cost, locale)}
            </span>
          </Row>
          <Row label={t.item.pathTotal}>
            <span className="display text-lg">{money(path.total, locale)}</span>
            <span className="block text-sm text-ink-2">{t.item.pathSteps(path.order.length)}</span>
          </Row>
          {path.settlement !== null && (
            <Row label={t.shipments.settlement}>{t.shipments.level.replace("{n}", String(path.settlement))}</Row>
          )}
          {path.jail > 0 && <Row label={t.shipments.jailShort}>{path.jail}</Row>}
          {shipment.buy !== null && !hasBlackMarket && (
            <Row label={t.shipments.buy}>
              <span className="display text-lg">{money(shipment.buy, locale)}</span>
            </Row>
          )}
        </dl>
        <Link
          href={`/${locale}/shipments?item=${itemSlug(item)}`}
          className="skew mt-4 inline-block bg-accent px-4 py-2 text-accent-ink"
        >
          <span className="display">{t.item.openInTree} →</span>
        </Link>
      </div>
    </section>
  );

  // The second row of the grid. With a shipment: what to buy and the details on the left, the shipment on the right.
  // Without one: the details on the left and where to buy on the right, so neither column is left empty.
  const left = shipment ? (
    <>
      {overviewBlock}
      {purchaseBlock}
      {detailsBlock}
    </>
  ) : (
    <>
      {overviewBlock}
      {detailsBlock}
    </>
  );
  const right = shipment ? shipmentBlock : purchaseBlock;

  return (
    <div className={PAGE_CONTAINER}>
      <Breadcrumbs
        locale={locale}
        crumbs={[
          { name: t.item.home, href: `/${locale}` },
          { name: t.nav.items, href: `/${locale}/items`, catalog: true },
          ...(category && item.category ? [{ name: category, href: `/${locale}${categoryPath(item.category)}` }] : []),
          { name, href: `/${locale}${itemPath(item)}` },
        ]}
      />

      {/* One grid for the whole page: the same two columns (5:7) in every row, so all the edges line up.
          On a phone it is one column in reading order: picture, title and prices, shipment, the rest. */}
      <div className="mt-4 grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="item-stage" style={{ "--r": rarityColor } as CSSProperties}>
          <div className="tile tile-solo" style={{ "--w": w, "--h": h, "--r": rarityColor } as CSSProperties}>
            {item.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconSrc(item.id)} alt={name} fetchPriority="high" />
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="display" style={{ color: rarityColor }}>
              {t.rarities[String(rarity)]}
            </span>
            {category && categoryHref && (
              <>
                <span className="text-ink-3">·</span>
                <Link href={categoryHref} className="text-ink-2 hover:text-accent">
                  {category}
                </Link>
              </>
            )}
            {typeName && (
              <>
                <span className="text-ink-3">·</span>
                <span className="text-ink-2">{typeName}</span>
              </>
            )}
          </div>
          <h1 className="display mt-2 text-4xl leading-none md:text-5xl">{name}</h1>
          {desc && <p className="mt-3 max-w-2xl text-ink-2">{desc}</p>}

          {/* Pushed to the bottom of the column, so the tiles end where the picture ends. */}
          {/* Phone: one column, each tile the full width. Wider: all tiles in one row, equal widths. */}
          <div className="mt-6 grid gap-3 sm:auto-cols-fr sm:grid-flow-col lg:mt-auto lg:pt-6">{stats}</div>

          {item.missing.length > 0 && (
            <p className="mt-3 rounded border border-line-2 bg-surface px-3 py-2 text-sm text-ink-2">{t.item.incomplete}</p>
          )}
        </div>

        <div className="order-last flex min-w-0 flex-col gap-10 lg:order-none">{left}</div>
        {right && <div className="min-w-0">{right}</div>}
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-lg leading-none">{t.item.similar}</h2>
            {category && categoryHref && (
              <Link href={categoryHref} className="text-sm text-ink-2 hover:text-accent">
                {t.item.allInCategory} «{category}» →
              </Link>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {similar.map((s) => (
              <li key={s.id}>
                <ItemCard item={s} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
