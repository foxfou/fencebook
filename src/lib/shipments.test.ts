import { describe, expect, it } from "vitest";
import itemsJson from "../../data/catalog/items.json";
import {
  addPick,
  buildGraph,
  computePlan,
  decodePicked,
  dependents,
  encodePicked,
  prerequisites,
  PLOT_PATH,
  removePick,
  type ShipmentNode,
} from "./shipments";
import { shipmentsData } from "./shipmentsData";

function node(id: string, requires: string[] = [], extra: Partial<ShipmentNode> = {}): ShipmentNode {
  return { id, item: id, category: "weapons", requires, cost: 100, buy: 10, jail: 0, tier: null, ...extra };
}

// root -> a -> b -> c, root -> x
const chain = [
  node("root", [], { cost: 10, buy: 1 }),
  node("a", ["root"], { cost: 20, buy: 2, tier: 1 }),
  node("b", ["a"], { cost: 30, buy: 3, tier: 2, jail: 5 }),
  node("c", ["b"], { cost: 40, buy: 4, tier: 3, jail: 7 }),
  node("x", ["root"], { cost: 50, buy: 5 }),
];

describe("buildGraph", () => {
  it("computes depth as the longest prerequisite chain", () => {
    const g = buildGraph([...chain, node("d", ["x", "c"])]);
    expect(g.depth.get("root")).toBe(0);
    expect(g.depth.get("c")).toBe(3);
    expect(g.depth.get("d")).toBe(4);
  });

  it("rejects an unknown prerequisite", () => {
    expect(() => buildGraph([node("a", ["ghost"])])).toThrow(/unknown shipment ghost/);
  });

  it("rejects a cycle", () => {
    expect(() => buildGraph([node("a", ["b"]), node("b", ["a"])])).toThrow(/Cycle/);
  });
});

describe("prerequisites and dependents", () => {
  const g = buildGraph(chain);

  it("lists every ancestor without the node itself", () => {
    expect(prerequisites(g, "c").sort()).toEqual(["a", "b", "root"]);
    expect(prerequisites(g, "root")).toEqual([]);
    expect(prerequisites(g, "missing")).toEqual([]);
  });

  it("lists every descendant without the node itself", () => {
    expect(dependents(g, "root").sort()).toEqual(["a", "b", "c", "x"]);
    expect(dependents(g, "b")).toEqual(["c"]);
    expect(dependents(g, "c")).toEqual([]);
  });

  it("does not repeat a node reachable by two paths", () => {
    const diamond = buildGraph([node("r"), node("l", ["r"]), node("m", ["r"]), node("t", ["l", "m"])]);
    expect(prerequisites(diamond, "t").sort()).toEqual(["l", "m", "r"]);
    expect(dependents(diamond, "r").sort()).toEqual(["l", "m", "t"]);
  });
});

describe("computePlan", () => {
  const g = buildGraph(chain);

  it("is empty for an empty choice", () => {
    expect(computePlan(g, [])).toEqual({
      steps: [], order: [], picked: [], required: [], rented: [],
      research: 0, rent: 0, total: 0, jail: 0, settlement: null,
    });
  });

  it("pulls in prerequisites and counts them once", () => {
    const p = computePlan(g, ["c"]);
    expect(p.order).toEqual(["root", "a", "b", "c"]);
    expect(p.picked).toEqual(["c"]);
    expect(p.required).toEqual(["root", "a", "b"]);
    expect(p.research).toBe(10 + 20 + 30 + 40);
  });

  it("does not add the purchase of the chosen items to the total: it is the cost of getting access", () => {
    const p = computePlan(g, ["c"]);
    expect(p.total).toBe(10 + 20 + 30 + 40);
    expect(p).not.toHaveProperty("buy");
  });

  it("does not count a shared prerequisite twice", () => {
    const p = computePlan(g, ["c", "x"]);
    expect(p.order).toEqual(["root", "a", "x", "b", "c"]);
    expect(p.research).toBe(10 + 20 + 50 + 30 + 40);
  });

  it("keeps a chosen prerequisite in `picked`, not in `required`", () => {
    const p = computePlan(g, ["a", "c"]);
    expect(p.picked).toEqual(["a", "c"]);
    expect(p.required).toEqual(["root", "b"]);
  });

  it("takes the highest tier as the settlement level and ignores shipments without one", () => {
    expect(computePlan(g, ["x"]).settlement).toBeNull();
    expect(computePlan(g, ["a"]).settlement).toBe(1);
    expect(computePlan(g, ["c"]).settlement).toBe(3);
  });

  it("needs the highest jail term of the plan, not the sum: a term is a threshold", () => {
    expect(computePlan(g, ["c"]).jail).toBe(7);
    expect(computePlan(g, ["b"]).jail).toBe(5);
    expect(computePlan(g, ["x"]).jail).toBe(0);
  });

  it("ignores a missing buy price", () => {
    const g2 = buildGraph([node("a", [], { buy: null, cost: 5 })]);
    expect(computePlan(g2, ["a"])).toMatchObject({ rent: 0, total: 5 });
  });

  it("ignores unknown ids and duplicates", () => {
    const p = computePlan(g, ["ghost", "a", "a"]);
    expect(p.order).toEqual(["root", "a"]);
  });

  it("orders by depth first, so every shipment follows its prerequisites", () => {
    const p = computePlan(g, ["c", "x", "b"]);
    for (const id of p.order) {
      for (const r of g.byId.get(id)!.requires) expect(p.order.indexOf(r)).toBeLessThan(p.order.indexOf(id));
    }
  });

  it("gives the same plan whatever the order of the choice", () => {
    expect(computePlan(g, ["x", "c", "a"])).toEqual(computePlan(g, ["a", "c", "x"]));
  });

  it("does not enforce tiers when the plot chain is not in the tree", () => {
    const p = computePlan(g, ["c"]);
    expect(p.rented).toEqual([]);
    expect(p.rent).toBe(0);
  });
});

describe("computePlan with land plots", () => {
  // Plots: p1 (no tier) -> p2 (needs tier 1) -> p3 (needs tier 2), like plot_sale_1..3 in the game.
  // A weapon line: h (no tier) -> o (tier 2) -> t1 (tier 3) -> t2 (tier 3); s (tier 1) stands alone.
  const plots = ["p1", "p2", "p3"];
  const g = buildGraph([
    node("p1", [], { category: "documents", cost: 1, buy: 100 }),
    node("p2", ["p1"], { category: "documents", cost: 2, buy: 200, tier: 1 }),
    node("p3", ["p2"], { category: "documents", cost: 3, buy: 300, tier: 2 }),
    node("h", [], { cost: 10, buy: 1000 }),
    node("o", ["h"], { cost: 20, buy: 2000, tier: 2 }),
    node("t1", ["o"], { cost: 30, buy: 3000, tier: 3 }),
    node("t2", ["t1"], { cost: 40, buy: 4000, tier: 3 }),
    node("s", [], { cost: 5, buy: 500, tier: 1 }),
  ]);

  it("rents the plots one by one right before their tier is needed", () => {
    const p = computePlan(g, ["t2"], plots);
    expect(p.order).toEqual(["h", "p1", "p2", "o", "p3", "t1", "t2"]);
    expect(p.steps.map((s) => s.kind)).toEqual(["required", "rent", "rent", "required", "rent", "required", "picked"]);
    expect(p.rented).toEqual(["p1", "p2", "p3"]);
    expect(p.settlement).toBe(3);
  });

  it("totals the research and the plots' rent, without buying the goal (4000)", () => {
    const p = computePlan(g, ["t2"], plots);
    expect(p.research).toBe(10 + 1 + 2 + 20 + 3 + 30 + 40);
    expect(p.rent).toBe(100 + 200 + 300);
    expect(p.total).toBe(p.research + p.rent);
  });

  it("rents only up to the highest tier of the plan", () => {
    expect(computePlan(g, ["s"], plots).order).toEqual(["p1", "s"]);
    expect(computePlan(g, ["o"], plots).rented).toEqual(["p1", "p2"]);
  });

  it("rents nothing when no shipment needs a settlement", () => {
    const p = computePlan(g, ["h"], plots);
    expect(p.order).toEqual(["h"]);
    expect(p.rent).toBe(0);
    expect(p.settlement).toBeNull();
  });

  it("a chosen plot is a goal: only the plots its tier needs are rented", () => {
    const p = computePlan(g, ["p2"], plots);
    expect(p.order).toEqual(["p1", "p2"]);
    expect(p.steps.map((s) => s.kind)).toEqual(["rent", "picked"]);
    expect(p.rented).toEqual(["p1"]);
    expect(p.rent).toBe(100);
  });

  it("a chosen plot that a tier needs is still rented, once", () => {
    const p = computePlan(g, ["p2", "o"], plots);
    expect(p.rented).toEqual(["p1", "p2"]);
    expect(p.rent).toBe(100 + 200);
    expect(p.picked).toContain("p2");
  });

  it("never opens a shipment before its prerequisites and its plot", () => {
    const p = computePlan(g, ["t2", "s"], plots);
    const at = (id: string) => p.order.indexOf(id);
    for (const id of p.order) {
      const n = g.byId.get(id)!;
      for (const r of n.requires) expect(at(r)).toBeLessThan(at(id));
      if (n.tier !== null) expect(at(plots[n.tier - 1])).toBeLessThan(at(id));
    }
  });

  describe("with a settlement the player already has", () => {
    it("does not research or rent the plots up to it again", () => {
      const p = computePlan(g, ["t2"], plots, 2);
      expect(p.order).toEqual(["h", "o", "p3", "t1", "t2"]);
      expect(p.rented).toEqual(["p3"]);
      expect(p.rent).toBe(300);
      expect(p.research).toBe(10 + 20 + 3 + 30 + 40);
      expect(p.total).toBe(p.research + p.rent);
    });

    it("opens shipments up to its tier right away", () => {
      const p = computePlan(g, ["o"], plots, 2);
      expect(p.order).toEqual(["h", "o"]);
      expect(p.rent).toBe(0);
    });

    it("needs nothing extra with the top settlement", () => {
      const p = computePlan(g, ["t2"], plots, 3);
      expect(p.rented).toEqual([]);
      expect(p.order).toEqual(["h", "o", "t1", "t2"]);
    });

    it("leaves an owned plot out even when it is a prerequisite of a chosen plot", () => {
      const p = computePlan(g, ["p3"], plots, 1);
      expect(p.order).toEqual(["p2", "p3"]);
      expect(p.rented).toEqual(["p2"]);
    });

    it("treats 0 and out-of-range values safely", () => {
      expect(computePlan(g, ["t2"], plots, 0)).toEqual(computePlan(g, ["t2"], plots));
      expect(computePlan(g, ["t2"], plots, 9).rented).toEqual([]);
      expect(computePlan(g, ["t2"], plots, -1)).toEqual(computePlan(g, ["t2"], plots));
    });
  });
});

describe("addPick and removePick", () => {
  const g = buildGraph(chain);

  it("adds without touching the input set", () => {
    const before = new Set(["a"]);
    const after = addPick(g, before, "x");
    expect([...before]).toEqual(["a"]);
    expect([...after].sort()).toEqual(["a", "x"]);
  });

  it("ignores an unknown id", () => {
    expect([...addPick(g, new Set(), "ghost")]).toEqual([]);
  });

  it("removes the shipment and everything chosen that depends on it", () => {
    const after = removePick(g, new Set(["a", "b", "c", "x"]), "b");
    expect([...after].sort()).toEqual(["a", "x"]);
  });

  it("does not bring the removed shipment back through a dependent", () => {
    const after = removePick(g, new Set(["b", "c"]), "b");
    expect(computePlan(g, after).order).toEqual([]);
  });
});

describe("encodePicked and decodePicked", () => {
  const g = buildGraph(chain);

  it("round-trips and sorts, so the same plan is the same string", () => {
    expect(encodePicked(["c", "a", "c"])).toBe("a,c");
    expect([...decodePicked(g, "a,c")].sort()).toEqual(["a", "c"]);
  });

  it("drops ids that no longer exist and tolerates empty input", () => {
    expect([...decodePicked(g, "a,gone,,c")].sort()).toEqual(["a", "c"]);
    expect(decodePicked(g, "").size).toBe(0);
    expect(decodePicked(g, null).size).toBe(0);
    expect(decodePicked(g, undefined).size).toBe(0);
  });
});

describe("real shipments data", () => {
  const items = new Set((itemsJson as { id: string }[]).map((i) => i.id));
  const g = buildGraph(shipmentsData.nodes);

  it("builds a graph and every item exists in the catalog", () => {
    expect(g.nodes.length).toBeGreaterThan(100);
    expect(g.nodes.filter((n) => !items.has(n.item))).toEqual([]);
  });

  it("every category used by a node is listed", () => {
    const listed = new Set(shipmentsData.categories.map((c) => c.id));
    expect(g.nodes.filter((n) => !listed.has(n.category))).toEqual([]);
  });

  it("researching everything costs the sum of all costs, and each shipment once", () => {
    const p = computePlan(g, g.nodes.map((n) => n.id));
    expect(p.order).toHaveLength(g.nodes.length);
    expect(p.research).toBe(g.nodes.reduce((s, n) => s + n.cost, 0));
    expect(p.required).toEqual([]);
  });

  it("the plot chain exists in the data", () => {
    for (const id of PLOT_PATH) expect(g.byId.has(id)).toBe(true);
  });

  it("TAG-12K Mk3 for a player with a level 2 settlement: only plot 3 is left to rent", () => {
    const full = computePlan(g, ["tag12k_m3"]);
    const p = computePlan(g, ["tag12k_m3"], PLOT_PATH, 2);
    expect(p.order).toEqual(["harris500_m1", "ordr12_m1", "plot_sale_3", "tag12k_m1", "tag12k_m2", "tag12k_m3"]);
    expect(p.rented).toEqual(["plot_sale_3"]);
    const plot = (id: string) => g.byId.get(id)!;
    const saved = ["plot_sale_1", "plot_sale_2"].reduce((s, id) => s + plot(id).cost + (plot(id).buy ?? 0), 0);
    expect(p.total).toBe(full.total - saved);
  });

  it("TAG-12K Mk3: Harris, plots 1 and 2, ORDR-12, plot 3, then the TAG-12K line (the owner's example)", () => {
    const p = computePlan(g, ["tag12k_m3"]);
    expect(p.order).toEqual([
      "harris500_m1",
      "plot_sale_1",
      "plot_sale_2",
      "ordr12_m1",
      "plot_sale_3",
      "tag12k_m1",
      "tag12k_m2",
      "tag12k_m3",
    ]);
    expect(p.picked).toEqual(["tag12k_m3"]);
    expect(p.rented).toEqual(["plot_sale_1", "plot_sale_2", "plot_sale_3"]);
    expect(p.settlement).toBe(3);
  });
});
