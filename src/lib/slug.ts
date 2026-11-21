// Readable URL slugs for item pages: /ru/items/quality-refrigerant instead of /ru/items/cargo_charge_workbench_upgrade_refrigerant_1.
// The slug comes from the English name, so it is the same in every language and the language switch keeps the page.

/** "Quality Refrigerant" -> "quality-refrigerant". Latin letters and digits only; accents are dropped. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Sluggable {
  id: string;
  names: Record<string, string | null>;
  /** Fields the pipeline could not fill. Unreleased items reuse another item's name and miss everything. */
  missing?: string[];
}

function commonPrefix(lists: string[][]): number {
  let n = 0;
  while (lists.every((l) => n < l.length - 1 && l[n] === lists[0][n])) n++;
  return n;
}

/**
 * Slug for every item id. An item with a unique English name gets the name alone.
 * Several items can share a name (tiers, key numbers, variants): then each one gets a suffix from its id,
 * without the part the ids share and without the words already in the name.
 * For example painkiller_1 and painkiller_2 ("Painkillers") become painkillers-1 and painkillers-2,
 * and bolt_cutter and super_bolt_cutter ("Bolt Cutter") become bolt-cutter and bolt-cutter-super.
 * If only one item of the group has complete data, it keeps the plain name: the real Warehouse is "warehouse",
 * the unreleased items that borrow its name get suffixes.
 */
export function buildSlugs(items: Sluggable[]): Map<string, string> {
  const groups = new Map<string, Sluggable[]>();
  for (const item of items) {
    const base = slugify(item.names.en || "") || slugify(item.id);
    const group = groups.get(base);
    if (group) group.push(item);
    else groups.set(base, [item]);
  }

  const slugs = new Map<string, string>();
  for (const [base, group] of groups) {
    if (group.length === 1) {
      slugs.set(group[0].id, base);
      continue;
    }
    const baseWords = new Set(base.split("-"));
    const tokens = group.map((i) => slugify(i.id).split("-"));
    const shared = commonPrefix(tokens);
    const suffixes = tokens.map((t) => t.slice(shared).filter((w) => !baseWords.has(w)).join("-"));
    const complete = group.filter((i) => !i.missing?.length);
    const primary = complete.length === 1 ? complete[0] : null;
    group.forEach((item, k) => {
      if (item === primary) {
        slugs.set(item.id, base);
        return;
      }
      const suffix = suffixes[k];
      // An empty suffix is fine only once and only if no primary item took the plain name.
      const unique = suffixes.filter((s) => s === suffix).length === 1 && (suffix !== "" || !primary);
      slugs.set(item.id, unique ? (suffix ? `${base}-${suffix}` : base) : `${base}-${slugify(item.id)}`);
    });
  }

  // A suffixed slug could still match another item's plain name: fall back to the id for the later one.
  const seen = new Set<string>();
  for (const item of items) {
    let slug = slugs.get(item.id)!;
    if (seen.has(slug)) slug = `${slug}-${slugify(item.id)}`;
    if (seen.has(slug)) throw new Error(`Duplicate item slug: ${slug} (${item.id})`);
    seen.add(slug);
    slugs.set(item.id, slug);
  }
  return slugs;
}
