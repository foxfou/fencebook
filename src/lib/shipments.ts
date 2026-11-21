// Larry's shipments: the unlock tree and the pure functions behind the planner.
// No React and no I/O here, so everything is covered by unit tests.
// The data file is imported in shipmentsData.ts, so client components can use these functions without bundling the data.

export type ShipmentCategoryId =
  | "documents"
  | "vehicles"
  | "construction"
  | "furnishings"
  | "weapons"
  | "production"
  | "gear"
  | "gadgets";

export type ShipmentTier = 1 | 2 | 3;

/** Node record from data/catalog/shipments.json (pipeline output). */
export interface ShipmentNode {
  /** Node id. Usually equals the item id, but not always: use `item` to look the item up. */
  id: string;
  /** Item id in data/catalog/items.json (names, icon, stats). */
  item: string;
  category: ShipmentCategoryId;
  /** Direct prerequisites. Empty for roots. */
  requires: string[];
  /** Cash needed to research the shipment. */
  cost: number;
  /** Price of buying the item on the Black Market once it is unlocked. */
  buy: number | null;
  /**
   * Jail term the player must have to unlock the shipment; 0 when none is needed.
   * Terms come from wipes (a self-made one or the weekly server wipe), so a newcomer cannot unlock these at once.
   * It is a threshold, not a price: nothing is paid for it.
   */
  jail: number;
  /** Level (1-3) of the settlement the player has to live in; null when the shipment has no such requirement. */
  tier: ShipmentTier | null;
}

export interface ShipmentsData {
  categories: { id: ShipmentCategoryId }[];
  nodes: ShipmentNode[];
}

export interface ShipmentGraph {
  nodes: readonly ShipmentNode[];
  byId: ReadonlyMap<string, ShipmentNode>;
  /** Direct dependents: nodes that list the key in `requires`. */
  children: ReadonlyMap<string, readonly string[]>;
  /** Length of the longest prerequisite chain; roots are 0. */
  depth: ReadonlyMap<string, number>;
}

/** Builds lookup tables. Throws on a dangling prerequisite or a cycle (the pipeline already rejects both). */
export function buildGraph(nodes: readonly ShipmentNode[]): ShipmentGraph {
  const byId = new Map<string, ShipmentNode>();
  for (const n of nodes) byId.set(n.id, n);

  const children = new Map<string, string[]>();
  for (const n of nodes) {
    for (const r of n.requires) {
      if (!byId.has(r)) throw new Error(`Shipment ${n.id} requires unknown shipment ${r}`);
      const list = children.get(r);
      if (list) list.push(n.id);
      else children.set(r, [n.id]);
    }
  }

  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const depthOf = (id: string): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) throw new Error(`Cycle in the shipment tree at ${id}`);
    visiting.add(id);
    let d = 0;
    for (const r of byId.get(id)!.requires) d = Math.max(d, depthOf(r) + 1);
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const n of nodes) depthOf(n.id);

  return { nodes, byId, children, depth };
}

/** All shipments that must be unlocked before `id` (direct and indirect), without `id` itself. */
export function prerequisites(graph: ShipmentGraph, id: string): string[] {
  const seen = new Set<string>();
  const stack = [...(graph.byId.get(id)?.requires ?? [])];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...graph.byId.get(cur)!.requires);
  }
  return [...seen];
}

/** All shipments that need `id` (direct and indirect), without `id` itself. */
export function dependents(graph: ShipmentGraph, id: string): string[] {
  const seen = new Set<string>();
  const stack = [...(graph.children.get(id) ?? [])];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...(graph.children.get(cur) ?? []));
  }
  return [...seen];
}

/**
 * Land plots by level (index 0 is level 1). A shipment of tier N can only be unlocked while the player rents a plot of level N,
 * and plots are rented in turn: level 1, then 2, then 3 (the plot of level N itself needs tier N-1). So a plan that needs tier N
 * also unlocks and rents the plots of levels 1..N, and they go into the unlock order right before they are needed.
 */
export const PLOT_PATH: readonly string[] = ["plot_sale_1", "plot_sale_2", "plot_sale_3"];

export interface PlanStep {
  id: string;
  /** picked: chosen by the player; required: a prerequisite of something chosen; rent: a land plot to unlock and rent for the tier. */
  kind: "picked" | "required" | "rent";
}

export interface Plan {
  /** Everything to do, in an order that can really be played: prerequisites first, a plot rented before its tier is needed. */
  steps: PlanStep[];
  /** The ids of `steps`, in the same order. */
  order: string[];
  /** Chosen shipments that exist in the tree, in unlock order. */
  picked: string[];
  /** Prerequisites that were not chosen, in unlock order. Plots to rent are not here, they are in `rented`. */
  required: string[];
  /** Land plots that have to be rented for the tiers of the plan, from level 1 up (a chosen plot is here too if a tier needs it). */
  rented: string[];
  /** Cash for researching everything in `order`. */
  research: number;
  /** Price of renting the plots in `rented`: without them the tiers cannot be unlocked. */
  rent: number;
  /**
   * What it costs to unlock the chosen shipments, so they can be bought: research + rent.
   * Buying the chosen items themselves is not included (the owner's rule: the plan answers "what does it cost to get access").
   */
  total: number;
  /** Jail term needed for the whole plan: the highest requirement in `order`. It is a threshold, so terms do not add up. */
  jail: number;
  /** Settlement level needed: the highest tier in `order`, null when nothing needs a settlement. */
  settlement: ShipmentTier | null;
}

function maxTier(graph: ShipmentGraph, ids: Iterable<string>): ShipmentTier | null {
  let t: ShipmentTier | null = null;
  for (const id of ids) {
    const tier = graph.byId.get(id)!.tier;
    if (tier !== null && (t === null || tier > t)) t = tier;
  }
  return t;
}

/**
 * Computes the plan for the chosen shipments. Unknown ids are ignored.
 * `plotPath` is the chain of land plots by level; if any of them is missing from the tree, tiers are not enforced
 * and plots are not added (the plan is then just the chosen shipments and their prerequisites).
 */
export function computePlan(graph: ShipmentGraph, chosen: Iterable<string>, plotPath: readonly string[] = PLOT_PATH): Plan {
  const pickedSet = new Set<string>();
  for (const id of chosen) if (graph.byId.has(id)) pickedSet.add(id);

  const need = new Set<string>();
  const addWithPrerequisites = (id: string) => {
    need.add(id);
    for (const p of prerequisites(graph, id)) need.add(p);
  };
  pickedSet.forEach(addWithPrerequisites);

  // Plots up to the highest tier. A plot can pull in more shipments, so repeat until the tier stops growing.
  const usePlots = plotPath.length > 0 && plotPath.every((id) => graph.byId.has(id));
  const plotLevel = new Map(usePlots ? plotPath.map((id, i) => [id, i + 1]) : []);
  const rentSet = new Set<string>();
  if (usePlots) {
    let tier = maxTier(graph, need) ?? 0;
    for (let lvl = 0; lvl < Math.min(tier, plotPath.length); lvl++) {
      rentSet.add(plotPath[lvl]);
      addWithPrerequisites(plotPath[lvl]);
      tier = Math.max(tier, maxTier(graph, need) ?? 0);
    }
  }

  // Unlock order: play it out. At each step take what is unlocked already: first the ordinary shipments
  // (shallow and cheap first), and only when nothing else is open, rent the next plot to raise the level.
  const byDepthCost = (a: string, b: string) => {
    const d = graph.depth.get(a)! - graph.depth.get(b)!;
    if (d !== 0) return d;
    const c = graph.byId.get(a)!.cost - graph.byId.get(b)!.cost;
    return c !== 0 ? c : a.localeCompare(b);
  };
  const order: string[] = [];
  const done = new Set<string>();
  let level = usePlots ? 0 : Infinity;
  const remaining = new Set(need);
  while (remaining.size > 0) {
    const open = [...remaining].filter((id) => {
      const n = graph.byId.get(id)!;
      return n.requires.every((r) => done.has(r)) && (n.tier ?? 0) <= level;
    });
    const ordinary = open.filter((id) => !rentSet.has(id)).sort(byDepthCost);
    const next = ordinary.length > 0 ? ordinary : open.filter((id) => rentSet.has(id)).sort((a, b) => plotLevel.get(a)! - plotLevel.get(b)!).slice(0, 1);
    // Nothing can be opened (a tier with no plot for it): add the rest by depth, so the plan is still complete.
    const take = next.length > 0 ? next : [...remaining].sort(byDepthCost);
    for (const id of take) {
      order.push(id);
      done.add(id);
      remaining.delete(id);
      const l = plotLevel.get(id);
      if (l !== undefined) level = Math.max(level, l);
    }
  }

  const steps: PlanStep[] = order.map((id) => ({
    id,
    kind: pickedSet.has(id) ? "picked" : rentSet.has(id) ? "rent" : "required",
  }));

  let research = 0;
  let rent = 0;
  let jail = 0;
  for (const s of steps) {
    const n = graph.byId.get(s.id)!;
    research += n.cost;
    jail = Math.max(jail, n.jail);
    // A plot needed for a tier is rented even if the player also chose it.
    if (rentSet.has(s.id)) rent += n.buy ?? 0;
  }

  return {
    steps,
    order,
    picked: steps.filter((s) => s.kind === "picked").map((s) => s.id),
    required: steps.filter((s) => s.kind === "required").map((s) => s.id),
    rented: order.filter((id) => rentSet.has(id)),
    research,
    rent,
    total: research + rent,
    jail,
    settlement: maxTier(graph, order),
  };
}

/** Adds a shipment to the chosen set. Its prerequisites are not added: `computePlan` pulls them in. */
export function addPick(graph: ShipmentGraph, chosen: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(chosen);
  if (graph.byId.has(id)) next.add(id);
  return next;
}

/**
 * Removes a shipment from the chosen set together with every chosen shipment that depends on it.
 * Otherwise the dependents would pull the removed shipment straight back into the plan.
 */
export function removePick(graph: ShipmentGraph, chosen: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(chosen);
  next.delete(id);
  for (const d of dependents(graph, id)) next.delete(d);
  return next;
}

/** Plan to string for the URL and for localStorage. Ids are stable between game patches, so old links keep working. */
export function encodePicked(chosen: Iterable<string>): string {
  return [...new Set(chosen)].sort().join(",");
}

/** Reads a string made by `encodePicked`. Ids that no longer exist are dropped. */
export function decodePicked(graph: ShipmentGraph, text: string | null | undefined): Set<string> {
  const result = new Set<string>();
  if (!text) return result;
  for (const id of text.split(",")) if (graph.byId.has(id)) result.add(id);
  return result;
}
