/* eslint-disable @next/next/no-img-element -- the image renderer (satori) needs a plain <img>; next/image does not apply here */
import { ImageResponse } from "next/og";
import { itemName, items, itemsById } from "@/lib/catalog";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { C, OG_SIZE, OgLogo, OgStripes, RARITY_HEX, iconData, ogFonts, ogMoney, siteHost, tileStyle } from "@/lib/og";
import { BRAND, GAME } from "@/lib/site";

export const alt = `${BRAND} — ${GAME}`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => items.map((i) => ({ locale, id: i.id })));
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginRight: 44 }}>
      <div style={{ display: "flex", fontFamily: "Body", fontSize: 20, letterSpacing: 2, color: C.ink3, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", marginTop: 6, fontFamily: "Display", fontStyle: "italic", fontWeight: 800, fontSize: accent ? 64 : 52, lineHeight: 1, color: accent ? C.accent : C.ink }}>
        {value}
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const loc = isLocale(locale) ? locale : "ru";
  const t = getDict(loc);
  const item = itemsById.get(id);
  const fonts = await ogFonts();

  if (!item) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
          <OgLogo tag={t.brandTag} scale={1.6} />
        </div>
      ),
      { ...size, fonts },
    );
  }

  const name = itemName(item, loc);
  const rarity = item.rarity ?? 0;
  const [w, h] = item.size ?? [1, 1];
  const unit = Math.floor(440 / Math.max(w, h));
  const icon = await iconData(item.id);
  const price = ogMoney(item.sell, loc);
  const perSlot = ogMoney(item.value_per_slot, loc);
  const nameSize = name.length <= 14 ? 88 : name.length <= 22 ? 70 : 56;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: C.bg, padding: 60 }}>
        <OgStripes />
        <div style={{ display: "flex", width: 460, height: 510, alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...tileStyle(rarity), width: unit * w, height: unit * h, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon ? <img src={icon} width={Math.round(unit * w * 0.84)} height={Math.round(unit * h * 0.84)} style={{ objectFit: "contain" }} alt="" /> : null}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginLeft: 56, width: 564 }}>
          <OgLogo tag={t.brandTag} scale={0.72} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Body", fontSize: 24, letterSpacing: 3, color: RARITY_HEX[rarity] ?? C.ink3, textTransform: "uppercase" }}>
              {t.rarities[String(rarity)]}
            </div>
            <div style={{ display: "flex", marginTop: 8, fontFamily: "Display", fontStyle: "italic", fontWeight: 800, fontSize: nameSize, lineHeight: 0.95, color: C.ink, textTransform: "uppercase" }}>
              {name}
            </div>
            <div style={{ display: "flex", marginTop: 36 }}>
              <Stat label={t.og.fencePrice} value={price ?? t.og.noPrice} accent={Boolean(price)} />
              {item.size ? <Stat label={t.og.size} value={`${w}×${h}`} /> : null}
              {perSlot && w * h > 1 ? <Stat label={t.og.perSlot} value={perSlot} /> : null}
            </div>
          </div>
          <div style={{ display: "flex", fontFamily: "Body", fontSize: 22, color: C.ink3 }}>
            <span style={{ color: C.accent }}>{siteHost}</span>
            <span style={{ marginLeft: 14 }}>· {GAME}</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
