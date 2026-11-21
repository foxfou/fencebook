import { describe, expect, it } from "vitest";
import itemsJson from "../../data/catalog/items.json";
import { getDict } from "./i18n";
import { LOOT_SPOTS, parsePurchase, SHOPS } from "./purchase";

const items = itemsJson as unknown as { purchase_from: string | null; loot_spot: string | null; type: string | null }[];

describe("parsePurchase", () => {
  it("reads the Black Market with and without a tier", () => {
    expect(parsePurchase("Trade Laptop (no conditions)")).toEqual([{ kind: "blackMarket", tier: null }]);
    expect(parsePurchase("Trade Laptop (tier III)")).toEqual([{ kind: "blackMarket", tier: 3 }]);
  });

  it("reads raid shops and several sources", () => {
    expect(parsePurchase("Trade Laptop (no conditions); Car Parts Dealer (price ×3 · Citizens only)")).toEqual([
      { kind: "blackMarket", tier: null },
      { kind: "shop", shop: "carParts", priceFactor: 3, civiliansOnly: true },
    ]);
  });

  it("keeps unknown text as it is", () => {
    expect(parsePurchase("Secret Vendor (Tuesdays)")).toEqual([{ kind: "other", text: "Secret Vendor (Tuesdays)" }]);
    expect(parsePurchase(null)).toEqual([]);
  });

  it("understands every source in the catalog, so no English text reaches the page", () => {
    for (const i of items) for (const s of parsePurchase(i.purchase_from)) expect(s.kind).not.toBe("other");
  });
});

describe("translations of the dataset's English values", () => {
  it("have every shop, loot spot and item type in both languages", () => {
    const spots = new Set(items.map((i) => i.loot_spot).filter(Boolean));
    const types = new Set(items.map((i) => i.type).filter(Boolean));
    for (const d of [getDict("ru"), getDict("en")]) {
      for (const s of SHOPS) expect(d.purchase.shops[s]).toBeTruthy();
      for (const s of LOOT_SPOTS) expect(d.lootSpots[s]).toBeTruthy();
      for (const s of spots) expect(d.lootSpots[s as string]).toBeTruthy();
      for (const s of types) expect(d.types[s as string]).toBeTruthy();
    }
  });
});
