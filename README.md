# Fencebook: a reference for ROB RUN

"Fencebook" is a working title; the final brand has not been decided. It lives in one place, `src/lib/site.ts` (`BRAND`), and the UI strings read it from there (`src/lib/i18n.ts`). "ROB RUN" (`GAME`) is the name of the game this reference covers, not the site's brand.

Built with Next.js 16 (App Router, static generation) and Tailwind 4, deployed to Cloudflare Workers through [OpenNext](https://opennext.js.org/cloudflare). Languages: Russian and English.

This repository is a **ready-to-build application**: everything needed for a build is inside it, including the item database (`data/catalog/`) and the icons (`public/icons/`). Nothing outside this folder is required.

## Commands

```bash
npm install
npm run dev       # development, http://localhost:3000
npm run lint
npm run build     # Next.js build (1004 static pages)
npm run preview   # Cloudflare build, then run in the workerd runtime, http://localhost:8787
npm run deploy    # build and publish to Cloudflare Workers (requires: npx wrangler login)
```

## Data

- `data/catalog/items.json`, `buildings.json`, `manifest.json`: the item database (names and descriptions in 6 languages, sizes, prices, categories).
- `public/icons/<id>.png`: item icons.

These files are **not edited by hand**. A separate pipeline, which lives outside this repository, publishes them. To update after a game patch: run the pipeline, review the changes, then commit the updated `data/` and `public/icons/`.

## CI

- `.github/workflows/ci.yml` runs on every push to `main` and every pull request: `npm ci`, lint, `npm run build`, and the Cloudflare build (on Linux).
- `.github/workflows/deploy.yml` deploys to Cloudflare Workers on every push to `main`. It also runs by hand (Actions, Deploy, Run workflow). Markdown-only changes do not trigger it.
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

- `src/app/[locale]/`: pages per language, the catalog (`page.tsx`) and the item page (`items/[id]/page.tsx`). Every page is generated at build time (`generateStaticParams`, `dynamicParams = false`), so the Worker only serves ready-made static output.
- `src/app/(root)/`: only a redirect from `/` to the default language.
- `src/lib/i18n.ts`: UI strings in Russian and English. Item names and descriptions come from the data in 6 languages.
- `src/lib/catalog.ts`: reads the catalog at build time; only a light list for filtering is sent to the client.
- `src/components/ItemBrowser.tsx`: the catalog with an inventory-style grid (a tile spans as many cells as the item has slots), search, filters by category, rarity and price, and sorting.
- `src/app/globals.css`: design tokens (colors, fonts, rarity tiles). Fonts: Sofia Sans Extra Condensed and Roboto Condensed (both OFL).
- `src/components/Logo.tsx`: the brand mark (a slanted plate with an "F") and the logo. The favicons (`src/app/icon.svg`, `favicon.ico`, `apple-icon.png`) use the same shapes.
- `src/app/[locale]/opengraph-image.tsx` and `src/app/[locale]/items/[id]/opengraph-image.tsx`: link preview images. They are rendered to PNG at build time, because chat apps do not accept SVG previews. The build downloads the two fonts from Google Fonts for them.
- `src/app/sitemap.ts` and `src/app/robots.ts`: `sitemap.xml` with language alternates, and `robots.txt`.

## Configuration

- `NEXT_PUBLIC_SITE_URL`: the site address used for canonical and hreflang links (defaults to `http://localhost:3000`). For a local deploy it is kept in `.env.production` (not part of the repository); in CI it comes from the `SITE_URL` variable.
- The Worker name is set in `wrangler.jsonc` (`rob-run-site`) and repeated in `services[].service`. A domain is bound to this Worker, so do not rename it (renaming requires rebinding the domain).

## Limitations

- `cacheComponents` and `partialPrefetching` are turned off: they need the Node.js runtime, which Workers is not.
- Next.js image optimization is off (`images.unoptimized`); icons are served as they are.
- On Windows OpenNext warns about incomplete compatibility. Building and running locally work; in CI the build runs on Linux.

## Disclaimer

This is an unofficial reference. It is not affiliated with Kefir. The rights to the game and its materials, including the icons and data in this repository, belong to their respective rights holders.
