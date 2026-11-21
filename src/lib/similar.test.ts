import { describe, expect, it } from "vitest";
import itemsJson from "../../data/catalog/items.json";
import { similarItems } from "./similar";

type T = Parameters<typeof similarItems>[0];
const it_ = (id: string, extra: Partial<T> = {}): T => ({
  id,
  family: null,
  category: "valuables",
  type: "Goods",
  rarity: 2,
  sell: 100,
  ...extra,
});

describe("similarItems", () => {
  const self = it_("ring_2", { family: "ring", sell: 1000 });
  const all = [
    self,
    it_("ring_1", { family: "ring", sell: 200 }),
    it_("ring_3", { family: "ring", sell: 5000 }),
    it_("watch", { type: "Goods", sell: 900 }),
    it_("cheap_goods", { type: "Goods", sell: 5 }),
    it_("phone", { type: "Electronics", sell: 1100 }),
    it_("gun", { category: "weapons", type: "Pistol", sell: 1000 }),
    it_("gun_rare", { category: "weapons", type: "Pistol", rarity: 2, sell: 50 }),
  ];

  it("puts the family first, then the same type, then the category, then the rarity", () => {
    expect(similarItems(self, all).map((i) => i.id)).toEqual([
      "ring_1",
      "ring_3",
      "watch",
      "cheap_goods",
      "phone",
      "gun",
      "gun_rare",
    ]);
  });

  it("never returns the item itself or repeats, and respects the limit", () => {
    const out = similarItems(self, all, 3);
    expect(out.map((i) => i.id)).toEqual(["ring_1", "ring_3", "watch"]);
  });

  it("treats items with the same game name as kin", () => {
    const a = { ...it_("ticket_1", { category: null, type: null, rarity: 1, sell: 1 }), name_key: "ticket" };
    const b = { ...it_("ticket_jackpot", { category: null, type: null, rarity: 6, sell: 1000000 }), name_key: "ticket" };
    expect(similarItems(a, [a, b, ...all]).map((i) => i.id)[0]).toBe("ticket_jackpot");
  });

  it("finds related items for every catalog item", () => {
    const items = itemsJson as unknown as T[];
    for (const item of items) {
      const out = similarItems(item, items);
      expect(out.length).toBeGreaterThan(0);
      expect(out.some((i) => i.id === item.id)).toBe(false);
      expect(new Set(out.map((i) => i.id)).size).toBe(out.length);
    }
  });
});
