// Layout of the shipments tree. Pure, so it is unit tested and runs at build time.
// Every category is a block; inside it the shipments hang top to bottom under their prerequisites.
// Blocks are packed left to right and wrap into rows, so the whole tree has a handy aspect ratio.
import type { ShipmentCategoryId, ShipmentGraph } from "./shipments";

export interface LayoutOptions {
  /** Distance between neighbouring shipments in a row. */
  pitchX: number;
  /** Distance between levels. */
  pitchY: number;
  /** Size of one shipment box (tile + name + price). */
  nodeW: number;
  nodeH: number;
  /** Space inside a block around the shipments. */
  blockPad: number;
  /** Height of the block title. */
  titleH: number;
  blockGap: number;
  /** A block that would stick out past this width starts a new row. */
  maxRowWidth: number;
}

export const DEFAULT_LAYOUT: LayoutOptions = {
  pitchX: 104,
  pitchY: 148,
  nodeW: 88,
  // 64px tile + two-line name + price. A name of two lines must fit without being clipped.
  nodeH: 122,
  blockPad: 24,
  titleH: 44,
  blockGap: 40,
  maxRowWidth: 2800,
};

export interface Point {
  x: number;
  y: number;
}

export interface PlacedBlock {
  id: ShipmentCategoryId;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  /** Top-left corner of every shipment box, by shipment id. */
  positions: Record<string, Point>;
  blocks: PlacedBlock[];
  width: number;
  height: number;
}

/**
 * Places every shipment. Categories come in the given order; a category with no shipments gets no block.
 * Inside a block a shipment sits under its first prerequisite from the same category, siblings go
 * from cheaper to dearer, and a parent is centred over its children.
 */
export function layoutShipments(
  graph: ShipmentGraph,
  categoryOrder: readonly ShipmentCategoryId[],
  opts: LayoutOptions = DEFAULT_LAYOUT,
): Layout {
  const positions: Record<string, Point> = {};
  const blocks: PlacedBlock[] = [];

  const byCost = (a: string, b: string) => {
    const d = graph.byId.get(a)!.cost - graph.byId.get(b)!.cost;
    return d !== 0 ? d : a.localeCompare(b);
  };

  // 1. Lay out each category on its own, with the block's top-left at (0, 0).
  const laid = categoryOrder
    .map((category) => {
      const ids = graph.nodes.filter((n) => n.category === category).map((n) => n.id);
      if (ids.length === 0) return null;
      const inBlock = new Set(ids);

      const parents = (id: string) => graph.byId.get(id)!.requires.filter((r) => inBlock.has(r));
      const kids = new Map<string, string[]>();
      const roots: string[] = [];
      for (const id of ids) {
        const p = parents(id)[0];
        if (p === undefined) roots.push(id);
        else kids.set(p, [...(kids.get(p) ?? []), id]);
      }

      // Level inside the block: below every prerequisite of the same category.
      const level = new Map<string, number>();
      const levelOf = (id: string): number => {
        const known = level.get(id);
        if (known !== undefined) return known;
        const l = parents(id).reduce((m, p) => Math.max(m, levelOf(p) + 1), 0);
        level.set(id, l);
        return l;
      };
      ids.forEach(levelOf);

      // Column of each shipment: leaves take the next free column, a parent sits in the middle of its children.
      const column = new Map<string, number>();
      let nextColumn = 0;
      const place = (id: string): void => {
        const children = (kids.get(id) ?? []).sort(byCost);
        if (children.length === 0) {
          column.set(id, nextColumn++);
          return;
        }
        children.forEach(place);
        column.set(id, (column.get(children[0])! + column.get(children[children.length - 1])!) / 2);
      };
      roots.sort(byCost).forEach(place);

      const maxLevel = Math.max(...ids.map((id) => level.get(id)!));
      const w = Math.max(nextColumn, 1) * opts.pitchX + 2 * opts.blockPad;
      const h = opts.titleH + opts.blockPad + maxLevel * opts.pitchY + opts.nodeH + opts.blockPad;
      const local: Record<string, Point> = {};
      for (const id of ids) {
        local[id] = {
          x: opts.blockPad + column.get(id)! * opts.pitchX + (opts.pitchX - opts.nodeW) / 2,
          y: opts.titleH + opts.blockPad + level.get(id)! * opts.pitchY,
        };
      }
      return { category, w, h, local };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  // 2. Pack the blocks into rows.
  let x = 0;
  let y = 0;
  let rowH = 0;
  let width = 0;
  for (const b of laid) {
    if (x > 0 && x + b.w > opts.maxRowWidth) {
      x = 0;
      y += rowH + opts.blockGap;
      rowH = 0;
    }
    blocks.push({ id: b.category, x, y, w: b.w, h: b.h });
    for (const [id, p] of Object.entries(b.local)) positions[id] = { x: x + p.x, y: y + p.y };
    x += b.w + opts.blockGap;
    rowH = Math.max(rowH, b.h);
    width = Math.max(width, x - opts.blockGap);
  }

  return { positions, blocks, width, height: y + rowH };
}

/** SVG path of the connector from a prerequisite down to the shipment that needs it. */
export function edgePath(from: Point, to: Point, opts: LayoutOptions = DEFAULT_LAYOUT): string {
  const x1 = from.x + opts.nodeW / 2;
  const y1 = from.y + opts.nodeH;
  const x2 = to.x + opts.nodeW / 2;
  const y2 = to.y;
  const mid = y1 + (y2 - y1) / 2;
  return `M${x1} ${y1}V${mid}H${x2}V${y2}`;
}
