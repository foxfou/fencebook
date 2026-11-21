/* eslint-disable @next/next/no-img-element -- the image renderer (satori) needs a plain <img>; next/image does not apply here */
import { ImageResponse } from "next/og";
import { items } from "@/lib/catalog";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { C, OG_SIZE, OgLogo, OgStripes, iconData, ogFonts, siteHost, tileStyle } from "@/lib/og";
import type { Item } from "@/lib/types";

// Link preview image for the item catalog: /<locale>/items/og.png.
// A route named og.png (not the opengraph-image convention) so the exported file keeps the .png extension
// and the static host serves it as image/png.
const size = OG_SIZE;
// Render at build time for every language (static export).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Six valuable items for the collage: two per rarity (legendary, epic, exotic), one per family. */
function collage(): Item[] {
  const seen = new Set<string>();
  const picked: Item[] = [];
  for (const rarity of [5, 4, 6]) {
    const pool = items
      .filter((i) => i.icon && i.sell !== null && i.rarity === rarity && i.category === "valuables")
      .sort((a, b) => (b.sell ?? 0) - (a.sell ?? 0));
    let taken = 0;
    for (const i of pool) {
      const family = i.family ?? i.id;
      if (seen.has(family)) continue;
      seen.add(family);
      picked.push(i);
      if (++taken === 2) break;
    }
  }
  // interleave the rarities so the grid looks mixed
  return [picked[0], picked[2], picked[4], picked[3], picked[5], picked[1]].filter(Boolean);
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDict(isLocale(locale) ? locale : "ru");
  const tiles = await Promise.all(collage().map(async (i) => ({ item: i, src: await iconData(i.id) })));
  const [top, bottom] = t.og.catalogHeadline;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: C.bg, padding: 64 }}>
        <OgStripes />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <OgLogo tag={t.brandTag} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", fontFamily: "Display", fontStyle: "italic", fontWeight: 800, fontSize: 96, lineHeight: 0.92, textTransform: "uppercase" }}>
              <span style={{ color: C.ink }}>{top}</span>
              <span style={{ color: C.ink }}>{bottom}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
              {t.og.catalogPoints.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", marginTop: 8, fontFamily: "Body", fontSize: 30, color: C.ink2 }}>
                  <div style={{ display: "flex", width: 12, height: 12, marginRight: 14, backgroundColor: C.accent }} />
                  {p}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: "Body", fontSize: 24, color: C.accent }}>{siteHost}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", width: 476, gap: 14, marginLeft: "auto", alignContent: "center" }}>
          {tiles.map(({ item, src }) => (
            <div key={item.id} style={{ ...tileStyle(item.rarity ?? 0), width: 148, height: 148, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {src ? <img src={src} width={118} height={118} style={{ objectFit: "contain" }} alt="" /> : null}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
