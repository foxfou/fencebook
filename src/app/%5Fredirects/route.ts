import { itemPath, items } from "@/lib/catalog";
import { defaultLocale, locales } from "@/lib/i18n";

// Cloudflare redirect rules: https://developers.cloudflare.com/workers/static-assets/redirects/
// The folder is named %5Fredirects so the exported file is out/_redirects (a folder starting with "_" is private in the App Router).
// Static export: route handlers must be marked static explicitly.
export const dynamic = "force-static";

// Cloudflare accepts at most 2000 static rules.
const MAX_RULES = 2000;

export function GET() {
  const rules = [`/ /${defaultLocale} 302`];
  // Item pages used to live at /<locale>/items/<id>. Old links keep working with a permanent redirect to the slug.
  for (const item of items) {
    const from = `/items/${item.id}`;
    const to = itemPath(item);
    if (from === to) continue;
    for (const l of locales) rules.push(`/${l}${from} /${l}${to} 301`);
  }
  if (rules.length > MAX_RULES) throw new Error(`_redirects has ${rules.length} rules, Cloudflare allows ${MAX_RULES}`);
  return new Response(rules.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
