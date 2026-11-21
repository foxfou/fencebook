import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGE_CONTAINER } from "@/components/PageHeader";
import { items, manifest } from "@/lib/catalog";
import { getDict, isLocale } from "@/lib/i18n";
import { alternates, shareTags } from "@/lib/seo";
import { shipmentsData } from "@/lib/shipmentsData";

// Landing page: what the project is and links to its sections.
// A first version: the full landing is still to be designed.

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    // The title template from the layout does not apply to page.tsx in the same segment, so the full title is set here.
    title: { absolute: t.seo.siteTitle },
    description: t.seo.siteDescription,
    ...shareTags({
      locale,
      title: t.seo.siteTitle,
      description: t.seo.siteDescription,
      path: `/${locale}`,
      // No preview image of its own yet: the catalog one shows what the site is about.
      image: `/${locale}/items/og.png`,
    }),
    alternates: alternates(locale, ""),
  };
}

function SectionCard({ href, title, count, text, cta }: { href: string; title: string; count: number; text: string; cta: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col border border-line bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="display text-3xl">{title}</h3>
        <span className="display text-4xl text-accent">{count}</span>
      </div>
      <p className="mt-2 flex-1 text-ink-2">{text}</p>
      <span className="mt-4 self-start skew bg-accent px-4 py-1.5 text-accent-ink">
        <span className="display text-lg">{cta} →</span>
      </span>
    </Link>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const h = t.home;
  return (
    <div className={PAGE_CONTAINER}>
      <section className="py-6 md:py-10">
        <h1 className="display text-5xl md:text-6xl">{h.title}</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-2">{h.lead}</p>
      </section>

      <section aria-labelledby="sections">
        <h2 id="sections" className="display mb-3 text-sm text-ink-3">
          {h.sections}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard
            href={`/${locale}/items`}
            title={h.items.title}
            count={items.length}
            text={h.items.text(items.length)}
            cta={h.items.cta}
          />
          <SectionCard
            href={`/${locale}/shipments`}
            title={h.shipments.title}
            count={shipmentsData.nodes.length}
            text={h.shipments.text(shipmentsData.nodes.length)}
            cta={h.shipments.cta}
          />
        </div>
      </section>

      <p className="mt-8 text-sm text-ink-3">{h.dataNote(manifest.game.buildid)}</p>
    </div>
  );
}
