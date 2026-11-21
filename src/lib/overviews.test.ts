import { describe, expect, it } from "vitest";
import itemsJson from "../../data/catalog/items.json";
import { itemOverview, overviews } from "./overviews";

const ids = (itemsJson as { id: string }[]).map((i) => i.id);

describe("overviews", () => {
  const ru = overviews.ru ?? {};

  it("has a Russian text for every catalog item", () => {
    expect(ids.filter((id) => !ru[id])).toEqual([]);
  });

  it("has no texts for items that are not in the catalog", () => {
    const known = new Set(ids);
    expect(Object.keys(ru).filter((id) => !known.has(id))).toEqual([]);
  });

  it("keeps the texts plain: no dashes, colons, semicolons or brackets", () => {
    expect(Object.entries(ru).filter(([, t]) => /[—–;:()«»]/.test(t))).toEqual([]);
  });

  it("returns null when a language has no text", () => {
    expect(itemOverview(ids[0], "en")).toBeNull();
    expect(itemOverview("no_such_item", "ru")).toBeNull();
  });
});
