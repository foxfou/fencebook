import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, hasFilters, parseFilters, serializeFilters, type Filters } from "./catalogFilters";

describe("catalog filters in the address", () => {
  it("leaves the address clean without filters", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
    expect(parseFilters("")).toEqual(DEFAULT_FILTERS);
    expect(hasFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it("round-trips every filter", () => {
    const f: Filters = { q: "кольцо gold", rars: [5, 2], min: "100", max: "5000", sort: "perSlot" };
    const qs = serializeFilters(f);
    expect(qs).toBe("q=%D0%BA%D0%BE%D0%BB%D1%8C%D1%86%D0%BE+gold&rarity=2,5&min=100&max=5000&sort=perSlot");
    expect(parseFilters(`?${qs}`)).toEqual({ ...f, rars: [2, 5] });
    expect(hasFilters(f)).toBe(true);
  });

  it("ignores broken values", () => {
    // An old address with a category filter (?cat=) just opens the whole list.
    expect(parseFilters("?sort=cheap&min=abc&max=-5&rarity=x,4,4&cat=,a,a")).toEqual({
      ...DEFAULT_FILTERS,
      rars: [4],
    });
  });
});
