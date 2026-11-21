import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGE_CONTAINER, PageHeader } from "@/components/PageHeader";
import { ShipmentPlanner } from "@/components/ShipmentPlanner";
import type { TreeBlock, TreeNode } from "@/components/ShipmentTree";
import { itemName, itemsById } from "@/lib/catalog";
import { money } from "@/lib/format";
import { getDict, isLocale } from "@/lib/i18n";
import { alternates, shareTags } from "@/lib/seo";
import { BRAND } from "@/lib/site";
import { layoutShipments } from "@/lib/shipmentLayout";
import { computePlan } from "@/lib/shipments";
import { shipmentsData, shipmentsGraph } from "@/lib/shipmentsData";

type Params = Promise<{ locale: string }>;

/** What it costs to research the whole tree: the number in the meta description. */
const everything = computePlan(
  shipmentsGraph,
  shipmentsData.nodes.map((n) => n.id),
).research;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    // The title template from the layout does not apply to page.tsx in the same segment, so the full title is set here.
    title: { absolute: `${t.seo.shipmentsTitle} | ${BRAND}` },
    description: t.seo.shipmentsDescription(shipmentsData.nodes.length, money(everything, locale)),
    ...shareTags({
      locale,
      title: t.seo.shipmentsTitle,
      description: t.seo.shipmentsShare,
      path: `/${locale}/shipments`,
      image: `/${locale}/shipments/og.png`,
    }),
    alternates: alternates(locale, "/shipments"),
  };
}

export default async function ShipmentsPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  const layout = layoutShipments(
    shipmentsGraph,
    shipmentsData.categories.map((c) => c.id),
  );

  const nodes: TreeNode[] = shipmentsData.nodes.map((n) => {
    const item = itemsById.get(n.item);
    return {
      ...n,
      name: item ? itemName(item, locale) : n.id,
      hasIcon: Boolean(item?.icon),
      rarity: item?.rarity ?? 0,
      ...layout.positions[n.id],
    };
  });
  const blocks: TreeBlock[] = layout.blocks.map((b) => ({ ...b, label: t.shipments.categories[b.id] ?? b.id }));

  // The same container and heading as the items page. On a wide screen the page also takes exactly the screen height
  // under the header, so the whole tree area is visible without scrolling.
  return (
    <div className={`${PAGE_CONTAINER} flex flex-col lg:h-[calc(100dvh-var(--header-h))]`}>
      {/* Without JavaScript the tree cannot be fitted to the screen, so it stays visible at full size. */}
      <noscript>
        <style>{`.snode-layer{opacity:1!important}.shipment-viewport{overflow:auto!important;touch-action:auto!important}`}</style>
      </noscript>
      <PageHeader title={t.shipments.title} lead={t.shipments.lead} />
      <ShipmentPlanner nodes={nodes} blocks={blocks} width={layout.width} height={layout.height} locale={locale} t={t.shipments} />
    </div>
  );
}
