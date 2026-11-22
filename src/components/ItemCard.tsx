import Link from "next/link";
import type { CSSProperties } from "react";
import { money } from "@/lib/format";
import { iconSrc } from "@/lib/icons";
import type { Locale } from "@/lib/types";

export interface ItemCardData {
  href: string;
  id: string;
  name: string;
  rarity: number;
  rarityLabel: string;
  sell: number | null;
  hasIcon: boolean;
}

/** A related item: tile with the icon, name, rarity and fence price. Used for "Similar items" on an item page. */
export function ItemCard({ item, locale }: { item: ItemCardData; locale: Locale }) {
  return (
    <Link href={item.href} className="item-card" style={{ "--r": `var(--color-r${item.rarity})` } as CSSProperties}>
      <span className="tile block" style={{ "--r": `var(--color-r${item.rarity})` } as CSSProperties}>
        {item.hasIcon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconSrc(item.id)} alt="" loading="lazy" decoding="async" />
        )}
      </span>
      <span className="item-card-name text-ink">{item.name}</span>
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span style={{ color: `var(--color-r${item.rarity})` }}>{item.rarityLabel}</span>
        {item.sell !== null && <span className="display text-sm text-accent">{money(item.sell, locale)}</span>}
      </span>
    </Link>
  );
}
