import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT, edgePath, layoutShipments, type Layout } from "./shipmentLayout";
import { buildGraph, type ShipmentCategoryId, type ShipmentNode } from "./shipments";
import { shipmentsData } from "./shipmentsData";

const O = DEFAULT_LAYOUT;

function node(id: string, requires: string[] = [], extra: Partial<ShipmentNode> = {}): ShipmentNode {
  return { id, item: id, category: "weapons", requires, cost: 100, buy: 10, jail: 0, tier: null, ...extra };
}

function overlap(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < O.nodeW && Math.abs(a.y - b.y) < O.nodeH;
}

function noOverlaps(layout: Layout): boolean {
  const pts = Object.values(layout.positions);
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (overlap(pts[i], pts[j])) return false;
  return true;
}

describe("layoutShipments", () => {
  it("puts a child one level below its parent and centres the parent over its children", () => {
    const g = buildGraph([node("root"), node("a", ["root"], { cost: 1 }), node("b", ["root"], { cost: 2 })]);
    const { positions: p } = layoutShipments(g, ["weapons"]);
    expect(p.a.y).toBe(p.root.y + O.pitchY);
    expect(p.b.y).toBe(p.a.y);
    expect(p.root.x).toBeCloseTo((p.a.x + p.b.x) / 2);
    expect(p.b.x - p.a.x).toBe(O.pitchX);
  });

  it("orders siblings from cheaper to dearer", () => {
    const g = buildGraph([node("root"), node("dear", ["root"], { cost: 900 }), node("cheap", ["root"], { cost: 5 })]);
    const { positions: p } = layoutShipments(g, ["weapons"]);
    expect(p.cheap.x).toBeLessThan(p.dear.x);
  });

  it("puts several roots side by side", () => {
    const g = buildGraph([node("r1"), node("r2"), node("c", ["r2"])]);
    const { positions: p } = layoutShipments(g, ["weapons"]);
    expect(p.r1.y).toBe(p.r2.y);
    expect(p.r2.x - p.r1.x).toBe(O.pitchX);
  });

  it("never overlaps shipments, even in a wide tree", () => {
    const leaves = Array.from({ length: 12 }, (_, i) => node(`l${i}`, ["root"], { cost: i }));
    const g = buildGraph([node("root"), ...leaves, node("deep", ["l3"])]);
    expect(noOverlaps(layoutShipments(g, ["weapons"]))).toBe(true);
  });

  it("is deterministic whatever the order of the input", () => {
    const nodes = [node("root"), node("a", ["root"]), node("b", ["root"]), node("c", ["a"])];
    const one = layoutShipments(buildGraph(nodes), ["weapons"]);
    const two = layoutShipments(buildGraph([...nodes].reverse()), ["weapons"]);
    expect(one).toEqual(two);
  });

  it("makes a block per category in the given order and skips empty ones", () => {
    const g = buildGraph([node("a", [], { category: "gear" }), node("b", [], { category: "weapons" })]);
    const { blocks } = layoutShipments(g, ["vehicles", "weapons", "gear"]);
    expect(blocks.map((b) => b.id)).toEqual(["weapons", "gear"]);
  });

  it("wraps blocks into a new row past maxRowWidth", () => {
    const g = buildGraph([node("a", [], { category: "gear" }), node("b", [], { category: "weapons" })]);
    const one = layoutShipments(g, ["gear", "weapons"], { ...O, maxRowWidth: 100000 });
    expect(one.blocks[1].y).toBe(0);
    expect(one.blocks[1].x).toBe(one.blocks[0].w + O.blockGap);
    const two = layoutShipments(g, ["gear", "weapons"], { ...O, maxRowWidth: 100 });
    expect(two.blocks[1].x).toBe(0);
    expect(two.blocks[1].y).toBe(two.blocks[0].h + O.blockGap);
    expect(two.height).toBe(two.blocks[1].y + two.blocks[1].h);
  });

  it("keeps a block on its own row even if it is wider than maxRowWidth", () => {
    const g = buildGraph([node("a")]);
    const { blocks } = layoutShipments(g, ["weapons"], { ...O, maxRowWidth: 10 });
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ x: 0, y: 0 });
  });

  it("lays a shipment under a prerequisite from the same block only", () => {
    // a requires something from another category: here it is a root of its own block
    const g = buildGraph([node("g", [], { category: "gear" }), node("a", ["g"], { category: "weapons" })]);
    const { positions: p, blocks } = layoutShipments(g, ["gear", "weapons"], { ...O, maxRowWidth: 100000 });
    const weapons = blocks.find((b) => b.id === "weapons")!;
    expect(p.a.y).toBe(weapons.y + O.titleH + O.blockPad);
  });
});

describe("edgePath", () => {
  it("goes from the bottom of the parent to the top of the child with one bend", () => {
    const d = edgePath({ x: 0, y: 0 }, { x: 104, y: 148 });
    const x1 = O.nodeW / 2;
    const y1 = O.nodeH;
    expect(d).toBe(`M${x1} ${y1}V${y1 + (148 - y1) / 2}H${104 + x1}V148`);
  });
});

describe("layout of the real tree", () => {
  const graph = buildGraph(shipmentsData.nodes);
  const order = shipmentsData.categories.map((c) => c.id as ShipmentCategoryId);
  const layout = layoutShipments(graph, order);

  it("places every shipment exactly once", () => {
    expect(Object.keys(layout.positions).sort()).toEqual(graph.nodes.map((n) => n.id).sort());
  });

  it("has no overlapping shipments", () => {
    expect(noOverlaps(layout)).toBe(true);
  });

  it("keeps every shipment inside its category block and every block inside the canvas", () => {
    for (const n of graph.nodes) {
      const p = layout.positions[n.id];
      const b = layout.blocks.find((x) => x.id === n.category)!;
      expect(p.x).toBeGreaterThanOrEqual(b.x);
      expect(p.y).toBeGreaterThanOrEqual(b.y + O.titleH);
      expect(p.x + O.nodeW).toBeLessThanOrEqual(b.x + b.w);
      expect(p.y + O.nodeH).toBeLessThanOrEqual(b.y + b.h);
    }
    for (const b of layout.blocks) {
      expect(b.x + b.w).toBeLessThanOrEqual(layout.width);
      expect(b.y + b.h).toBeLessThanOrEqual(layout.height);
    }
  });

  it("has no overlapping blocks", () => {
    for (const a of layout.blocks) {
      for (const b of layout.blocks) {
        if (a === b) continue;
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart).toBe(true);
      }
    }
  });

  it("draws every connector downwards", () => {
    for (const n of graph.nodes) {
      for (const r of n.requires) expect(layout.positions[n.id].y).toBeGreaterThan(layout.positions[r].y);
    }
  });

  it("has a handy aspect ratio for a screen", () => {
    expect(layout.width / layout.height).toBeGreaterThan(0.8);
    expect(layout.width / layout.height).toBeLessThan(2.2);
  });
});
