// Working name of the site. The final brand is not decided: change it ONLY here (and the site URL below).
export const BRAND = "Fencebook";

// Name of the game this reference covers. It is not the site brand. Do not change it.
export const GAME = "ROB RUN";

// Site URL for canonical and hreflang links. Set it at build time: NEXT_PUBLIC_SITE_URL=https://your-domain
// For a deploy it lives in .env.production, which is not part of the repository.
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
