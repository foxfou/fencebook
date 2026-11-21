/* eslint-disable @next/next/no-img-element -- the image renderer (satori) needs a plain <img>; next/image does not apply here */
import { ImageResponse } from "next/og";
import { itemsById } from "@/lib/catalog";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { C, OG_SIZE, OgLogo, OgStripes, iconData, ogFonts, siteHost, tileStyle } from "@/lib/og";
import { shipmentsData } from "@/lib/shipmentsData";

// Link preview image for the shipments page: /<locale>/shipments/og.png (see the catalog route for why it is a plain route).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Six shipments for the collage: the dearest one with an icon from each of six different categories. */
function collage() {
  const wanted = ["weapons", "vehicles", "gear", "production", "furnishings", "gadgets"];
  return wanted
    .map((category) =>
      shipmentsData.nodes
        .filter((n) => n.category === category && itemsById.get(n.item)?.icon)
        .sort((a, b) => b.cost - a.cost || a.id.localeCompare(b.id))[0],
    )
    .filter(Boolean)
    .map((n) => itemsById.get(n.item)!);
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = getDict(isLocale(locale) ? locale : "ru");
  const tiles = await Promise.all(collage().map(async (i) => ({ item: i, src: await iconData(i.id) })));
  const [top, bottom] = t.og.shipmentsHeadline;

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
              {t.og.shipmentsPoints.map((p) => (
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
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
