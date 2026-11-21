import { describe, expect, it } from "vitest";
import itemsJson from "../../data/catalog/items.json";
import { buildSlugs, slugify } from "./slug";

const item = (id: string, en: string) => ({ id, names: { en } });

describe("slugify", () => {
  it("makes a lower-case, hyphenated latin slug", () => {
    expect(slugify("Quality Refrigerant")).toBe("quality-refrigerant");
    expect(slugify("Larry's  Bag & Co.")).toBe("larrys-bag-and-co");
    expect(slugify("Café Crème")).toBe("cafe-creme");
    expect(slugify("  --AK-47--  ")).toBe("ak-47");
  });
});

describe("buildSlugs", () => {
  it("uses the plain name when it is unique", () => {
    const slugs = buildSlugs([item("cargo_charge_workbench_upgrade_refrigerant_1", "Quality Refrigerant")]);
    expect(slugs.get("cargo_charge_workbench_upgrade_refrigerant_1")).toBe("quality-refrigerant");
  });

  it("adds the differing part of the id when names repeat", () => {
    const slugs = buildSlugs([
      item("painkiller_1", "Painkillers"),
      item("painkiller_2", "Painkillers"),
      item("deposit_box_1_cumulative", "Deposit Box Keys"),
      item("deposit_box_1_full", "Deposit Box Keys"),
    ]);
    expect(slugs.get("painkiller_1")).toBe("painkillers-1");
    expect(slugs.get("painkiller_2")).toBe("painkillers-2");
    expect(slugs.get("deposit_box_1_cumulative")).toBe("deposit-box-keys-cumulative");
    expect(slugs.get("deposit_box_1_full")).toBe("deposit-box-keys-full");
  });

  it("drops words that are already in the name", () => {
    const slugs = buildSlugs([item("bolt_cutter", "Bolt Cutter"), item("super_bolt_cutter", "Bolt Cutter")]);
    expect(slugs.get("bolt_cutter")).toBe("bolt-cutter");
    expect(slugs.get("super_bolt_cutter")).toBe("bolt-cutter-super");
  });

  it("falls back to the id when a suffixed slug meets another plain name", () => {
    const slugs = buildSlugs([item("chip_1", "Chips"), item("chip_2", "Chips"), item("other", "Chips 1")]);
    expect(new Set(slugs.values()).size).toBe(3);
  });

  it("gives every catalog item a unique, URL-safe slug", () => {
    const items = itemsJson as { id: string; names: Record<string, string | null> }[];
    const slugs = buildSlugs(items);
    const values = items.map((i) => slugs.get(i.id));
    expect(new Set(values).size).toBe(items.length);
    for (const s of values) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slugs.get("cargo_charge_workbench_upgrade_refrigerant_1")).toBe("quality-refrigerant");
    expect(slugs.get("storage_building_1")).toBe("warehouse");
    expect(slugs.get("lottery_ticket_1")).toBe("lottery-ticket");
    expect(slugs.get("lottery_ticket_jackpot_1")).toBe("lottery-ticket-jackpot");
  });
});
