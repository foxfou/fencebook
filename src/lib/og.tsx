// Shared parts of the link preview images (opengraph-image files).
// They are rendered to PNG at build time: chat apps and social networks do not accept SVG previews.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MARK_PATHS } from "@/components/Logo";
import { BRAND_PARTS, siteUrl } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  bg: "#12110f",
  surface: "#1a1816",
  line: "#2c2925",
  accent: "#c9f33a",
  ink: "#ece8e2",
  ink2: "#a09b94",
  ink3: "#6e6a64",
};

export const RARITY_HEX: Record<number, string> = {
  0: "#6e6a64",
  1: "#8f8b85",
  2: "#3cd070",
  4: "#b87cf8",
  5: "#f59e0b",
  6: "#ef4444",
};

export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Rarity tile background, like the inventory tiles on the site. */
export function tileStyle(rarity: number) {
  const c = RARITY_HEX[rarity] ?? RARITY_HEX[0];
  return {
    backgroundColor: "#0d0c0b",
    backgroundImage: `linear-gradient(165deg, ${rgba(c, 0.45)} 0%, ${rgba(c, 0.12)} 100%)`,
    border: `2px solid ${rgba(c, 0.55)}`,
    borderRadius: 6,
  };
}

/** The game fonts as TTF, fetched once per build process. Satori needs TTF/OTF, not woff2. */
async function googleFont(family: string, axis: string): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${axis}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error(`Preview font not found: ${family}`);
  return (await fetch(url)).arrayBuffer();
}

let fontsPromise: ReturnType<typeof loadFonts> | null = null;

async function loadFonts() {
  const [display, body] = await Promise.all([
    googleFont("Sofia Sans Extra Condensed", "ital,wght@1,800"),
    googleFont("Roboto Condensed", "wght@500"),
  ]);
  return [
    { name: "Display", data: display, weight: 800 as const, style: "italic" as const },
    { name: "Body", data: body, weight: 500 as const, style: "normal" as const },
  ];
}

export function ogFonts() {
  fontsPromise ??= loadFonts();
  return fontsPromise;
}

/** Item icon as a data URI, or null if there is no icon. */
export async function iconData(id: string): Promise<string | null> {
  try {
    const png = await readFile(join(process.cwd(), "public", "icons", `${id}.png`));
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Money for the images: plain spaces, because the fonts may lack narrow no-break spaces. */
export function ogMoney(n: number | null, locale: string): string | null {
  if (n === null) return null;
  return "$" + n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US").replace(/[  ]/g, " ");
}

export const siteHost = new URL(siteUrl).host;

/** Logo for the images: mark + two-tone wordmark + caption. */
export function OgLogo({ tag, scale = 1 }: { tag: string; scale?: number }) {
  const s = (n: number) => Math.round(n * scale);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(16) }}>
      <svg width={s(56)} height={s(56)} viewBox="0 0 32 32">
        <path d={MARK_PATHS.plate} fill={C.accent} />
        <path d={MARK_PATHS.letter} fill={C.bg} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "Display", fontStyle: "italic", fontWeight: 800, fontSize: s(48), lineHeight: 0.9, textTransform: "uppercase" }}>
          <span style={{ color: C.ink }}>{BRAND_PARTS[0]}</span>
          <span style={{ color: C.accent }}>{BRAND_PARTS[1]}</span>
        </div>
        <div style={{ display: "flex", marginTop: s(6), fontFamily: "Body", fontSize: s(15), letterSpacing: s(3), color: C.ink3, textTransform: "uppercase" }}>
          {tag}
        </div>
      </div>
    </div>
  );
}

/** Slanted lime stripes in the corner: the same shape as the buttons and the mark. */
export function OgStripes() {
  return (
    <svg width="420" height="630" viewBox="0 0 420 630" style={{ position: "absolute", right: 0, top: 0 }}>
      <path d="M260 0h60L185 630h-60z" fill={rgba(C.accent, 0.07)} />
      <path d="M350 0h70v0L285 630h-70z" fill={rgba(C.accent, 0.05)} />
    </svg>
  );
}
