# Fencebook: a reference for ROB RUN

"Fencebook" is a working title; the final brand has not been decided. It lives in one place, `src/lib/site.ts` (`BRAND_PARTS`, `BRAND`), and the UI strings read it from there (`src/lib/i18n.ts`). "ROB RUN" (`GAME`) is the name of the game this reference covers, not the site's brand.

Built with Next.js 16 (App Router) and Tailwind 4. The whole site is a **static export**: `next build` writes every page, preview image, `sitemap.xml` and `robots.txt` to `out/`. Cloudflare Workers serves these files as static assets, so no server code runs. Languages: Russian and English.

This repository is a **ready-to-build application**: everything needed for a build is inside it, including the item database (`data/catalog/`) and the icons (`public/icons/`). Nothing outside this folder is required.

## Commands

```bash
npm install
npm run dev       # development, http://localhost:3000
npm run lint
npm run build     # static export to out/ (pages, 1000 preview images, sitemap, robots)
npm run preview   # build, then serve out/ with wrangler dev, http://localhost:8787
npm run deploy    # build and upload out/ to Cloudflare (requires: npx wrangler login)
```

## Data

- `data/catalog/items.json`, `buildings.json`, `manifest.json`: the item database (names and descriptions in 6 languages, sizes, prices, categories).
- `public/icons/<id>.png`: item icons.

These files are **not edited by hand**. A separate pipeline, which lives outside this repository, publishes them. The pipeline also applies a small set of manual fixes: it leaves out unreleased placeholder items, and it fills in names or fields that the game files and the dataset lack. The `manual` field of an item lists the fields set this way. To update after a game patch: run the pipeline, review the changes, then commit the updated `data/` and `public/icons/`.

## CI

- `.github/workflows/ci.yml` runs on every push to `main` and every pull request: `npm ci`, lint, `npm run build`, and a dry run of the Cloudflare deploy.
- `.github/workflows/deploy.yml` deploys to Cloudflare on every push to `main`. It also runs by hand (Actions, Deploy, Run workflow). Markdown-only changes do not trigger it.
- Set these once in Settings, Secrets and variables, Actions:
  - secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
  - variable: `SITE_URL`, for example `https://fencebook.funchosa.com`
- If the secrets are missing, the job ends with a warning and deploys nothing.

Token permissions (create it in the Cloudflare account that owns the zone):
- Account: Workers Scripts, Edit
- Zone: Workers Routes, Edit
- Zone: DNS, Edit
- Zone: Zone, Read
- Limit the zone resources to the site's domain.

## How it is organized

- `src/app/[locale]/`: pages per language: the landing page (`page.tsx`), the item catalog (`items/page.tsx`), the item page (`items/[slug]/page.tsx`) and the shipments tree (`shipments/page.tsx`). Every page is generated at build time (`generateStaticParams`, `dynamicParams = false`).
- `src/app/[locale]/items/category/[category]/page.tsx`: a page per item category with its own title and text, linked from the catalog, the item pages and the breadcrumbs.
- Item pages have readable addresses built from the English name: `/ru/items/quality-refrigerant`. Items that share a name get a short suffix from their id (`painkillers-1`, `painkillers-2`). The rules are in `src/lib/slug.ts`; the slug is the same in every language.
- `src/app/(root)/`: the page for `/`.
- `src/app/%5Fredirects/route.ts`: writes `out/_redirects` for Cloudflare at build time. It sends `/` to `/ru` and the old item addresses (`/ru/items/<id>`) to the new ones with a permanent redirect.
- `src/lib/i18n.ts`: UI, SEO and preview texts in Russian and English. Item names and descriptions come from the data in 6 languages.
- `src/lib/catalog.ts`: reads the catalog at build time; only a light list for filtering is sent to the client.
- `src/components/ItemBrowser.tsx`: the catalog with an inventory-style grid (a tile spans as many cells as the item has slots), search, filters by category, rarity and price, and sorting.
- `src/app/globals.css`: design tokens (colors, fonts, rarity tiles). Fonts: Sofia Sans Extra Condensed and Roboto Condensed (both OFL).
- `src/components/Logo.tsx`: the brand mark (a slanted plate with an "F") and the logo. The favicons (`src/app/icon.svg`, `favicon.ico`, `apple-icon.png`) use the same shapes.
- `src/app/[locale]/items/og.png/route.tsx` and `src/app/[locale]/items/[slug]/og.png/route.tsx`: link preview images, rendered to PNG at build time (chat apps do not accept SVG previews). They are routes named `og.png`, so the exported files keep the `.png` extension. The build downloads the two fonts from Google Fonts for them. Shared parts are in `src/lib/og.tsx`.
- `src/lib/seo.ts`: canonical and hreflang links, Open Graph and Twitter tags.
- `src/app/sitemap.ts` and `src/app/robots.ts`: `sitemap.xml` with language alternates, and `robots.txt`.

## Configuration

- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_YANDEX_VERIFICATION`: optional site ownership codes for Google Search Console and Yandex Webmaster. When set, the pages get the matching meta tags. In CI they come from the `GOOGLE_SITE_VERIFICATION` and `YANDEX_VERIFICATION` variables.
- `NEXT_PUBLIC_SITE_URL`: the site address used for canonical, hreflang, preview and sitemap links (defaults to `http://localhost:3000`). For a local deploy it is kept in `.env.production` (not part of the repository); in CI it comes from the `SITE_URL` variable.
- `wrangler.jsonc`: the Worker name (`rob-run-site`), the assets folder (`out/`) and the custom domain. A domain is bound to this Worker, so do not rename it (renaming requires rebinding the domain).

## Limitations

- No server code runs. Server features (API routes, ISR, middleware, Server Actions) are not available. Accounts and comments will need a separate API Worker.
- Next.js image optimization is off (`images.unoptimized`); icons are served as they are.
- The export is about 270 MB, mostly the preview images. Cloudflare uploads only changed files on each deploy.

## Disclaimer

This is an unofficial reference. It is not affiliated with Kefir. The rights to the game and its materials, including the icons and data in this repository, belong to their respective rights holders.
