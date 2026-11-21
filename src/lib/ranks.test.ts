import { describe, expect, it } from "vitest";
import { categoryRanks, leaders } from "./ranks";

const it_ = (id: string, category: string | null, sell: number | null, slot: number | null) => ({
  id,
  category,
  sell,
  value_per_slot: slot,
});

const list = [
  it_("a", "guns", 1000, 100),
  it_("b", "guns", 500, 500),
  it_("c", "guns", 500, null),
  it_("d", "guns", null, null),
  it_("x", "food", 9999, 9999),
];

describe("categoryRanks", () => {
  it("counts the category and places the item by price and by value per slot", () => {
    expect(categoryRanks(list[0], list)).toEqual({ n: 4, sellRank: 1, slotRank: 2 });
    expect(categoryRanks(list[1], list)).toEqual({ n: 4, sellRank: 2, slotRank: 1 });
  });

  it("lets ties share a place and leaves missing values unranked", () => {
    expect(categoryRanks(list[2], list)).toEqual({ n: 4, sellRank: 2, slotRank: null });
    expect(categoryRanks(list[3], list)).toEqual({ n: 4, sellRank: null, slotRank: null });
  });

  it("does not rank an item without a category", () => {
    expect(categoryRanks(it_("z", null, 5, 5), list)).toEqual({ n: 0, sellRank: null, slotRank: null });
  });
});

describe("leaders", () => {
  it("finds the most expensive item and the best value per slot", () => {
    const { top, bestSlot } = leaders(list.slice(0, 4));
    expect(top?.id).toBe("a");
    expect(bestSlot?.id).toBe("b");
    expect(leaders([it_("d", "guns", null, null)])).toEqual({ top: null, bestSlot: null });
  });
});
