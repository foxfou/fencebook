// Working name of the site. The final brand is not decided: change it ONLY here (and the site URL below).
// The logo shows the two parts in two colors: "FENCE" + "BOOK".
export const BRAND_PARTS = ["Fence", "book"] as const;
export const BRAND = BRAND_PARTS.join("");

// Name of the game this reference covers. It is not the site brand. Do not change it.
export const GAME = "ROB RUN";

// Site URL for canonical and hreflang links. Set it at build time: NEXT_PUBLIC_SITE_URL=https://your-domain
// For a local deploy it lives in .env.production, which is not part of the repository.
// "||" (not "??") on purpose: an empty value from CI must fall back to the default, because new URL("") throws.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
