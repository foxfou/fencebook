"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { money } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import {
  addPick,
  buildGraph,
  computePlan,
  decodePicked,
  encodePicked,
  PLOT_PATH,
  prerequisites,
  removePick,
  type ShipmentCategoryId,
  type ShipmentGraph,
} from "@/lib/shipments";
import { DEFAULT_LAYOUT, layoutShipments } from "@/lib/shipmentLayout";
import { ShipmentTree, type FocusRequest, type Rect, type TreeBlock, type TreeNode } from "./ShipmentTree";

interface Props {
  nodes: TreeNode[];
  blocks: TreeBlock[];
  width: number;
  height: number;
  locale: string;
  t: Dict["shipments"];
}

const STORAGE_KEY = "fencebook:shipments-plan";
const OWNED_KEY = "fencebook:shipments-owned-level";
const ROMAN = ["", "I", "II", "III"];

/**
 * A tiny store over one localStorage key for useSyncExternalStore. If storage is unavailable (private mode, blocked),
 * the value still works for the visit and is just not saved. Another tab changing the key updates this one too.
 */
function createStoredValue(key: string) {
  let memory = "";
  const listeners = new Set<() => void>();
  return {
    read(): string {
      try {
        return localStorage.getItem(key) ?? "";
      } catch {
        return memory;
      }
    },
    write(value: string): void {
      memory = value;
      try {
        localStorage.setItem(key, value);
      } catch {
        /* not saved, kept in memory */
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

const planStore = createStoredValue(STORAGE_KEY);
/** The settlement level the player already has: "" or "0" none, "1".."3". */
const ownedStore = createStoredValue(OWNED_KEY);
const serverEmpty = () => "";

function fill(template: string, n: number | string): string {
  return template.replace("{n}", String(n));
}

/** Level of a land plot (1-3), or 0 for any other shipment. */
function plotLevel(id: string): number {
  return PLOT_PATH.indexOf(id) + 1;
}

/** The shipments page body: a side panel (filters, plan, the shipment card) and the tree. */
export function ShipmentPlanner({ nodes, blocks, width, height, locale, t }: Props) {
  const graph = useMemo(() => buildGraph(nodes), [nodes]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // One category at a time: picking another chip replaces the previous one.
  const [cat, setCat] = useState<string | null>(null);
  // Settlement level filter: only what can be unlocked at this level stays on the tree (tier up to it, or no tier).
  const [level, setLevel] = useState<number | null>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);

  // The plan lives in localStorage (this browser only); the server render and the first paint see an empty plan.
  const stored = useSyncExternalStore(planStore.subscribe, planStore.read, serverEmpty);
  const picked = useMemo(() => decodePicked(graph, stored), [graph, stored]);
  const setPicked = (update: (p: ReadonlySet<string>) => Set<string>) => planStore.write(encodePicked(update(picked)));

  // The settlement the player already has: its plots are not counted again.
  const ownedRaw = useSyncExternalStore(ownedStore.subscribe, ownedStore.read, serverEmpty);
  const owned = Math.min(Math.max(Number.parseInt(ownedRaw, 10) || 0, 0), PLOT_PATH.length);
  const setOwned = (l: number) => ownedStore.write(String(l));

  const plan = useMemo(() => computePlan(graph, picked, PLOT_PATH, owned), [graph, picked, owned]);
  const inPlan = useMemo(() => new Set(plan.order), [plan]);

  const related = useMemo(() => {
    if (!pinned) return null;
    // Only the path to the pinned shipment: it and what has to be unlocked before it. What it opens stays as it is.
    return new Set([pinned, ...prerequisites(graph, pinned)]);
  }, [graph, pinned]);

  const q = query.trim().toLowerCase();
  const faded = useMemo(() => {
    if (!q && cat === null) return null;
    return new Set(
      nodes
        .filter((n) => (cat !== null && n.category !== cat) || (q !== "" && !n.name.toLowerCase().includes(q)))
        .map((n) => n.id),
    );
  }, [nodes, q, cat]);
  // With a settlement level chosen the tree is rebuilt from the available shipments only, so there are no gaps:
  // the same layout as the full tree (blocks by category, shipments under their prerequisites), just fewer of them.
  // Without a level it is the layout made at build time.
  const tree = useMemo(() => {
    if (level === null) return { nodes, blocks, width, height };
    const keep = nodes.filter((n) => (n.tier ?? 0) <= level);
    const ids = new Set(keep.map((n) => n.id));
    const sub = keep.map((n) => ({ ...n, requires: n.requires.filter((r) => ids.has(r)) }));
    const laid = layoutShipments(buildGraph(sub), blocks.map((b) => b.id as ShipmentCategoryId));
    const labels = new Map(blocks.map((b) => [b.id, b.label]));
    return {
      nodes: sub.map((n) => ({ ...n, ...laid.positions[n.id] })),
      blocks: laid.blocks.map((b) => ({ ...b, label: labels.get(b.id) ?? b.id })),
      width: laid.width,
      height: laid.height,
    };
  }, [level, nodes, blocks, width, height]);
  const placed = useMemo(() => new Map(tree.nodes.map((n) => [n.id, n])), [tree]);
  const visible = (id: string) => placed.has(id);
  const matches = tree.nodes.filter((n) => !faded?.has(n.id)).length;
  const anyFilter = faded !== null || level !== null;
  // Category and level are folded under the "Filters" button; its badge counts the ones that are on.
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Full screen of the tree view; here and not in the tree, because the filter bar moves over the canvas then.
  const [full, setFull] = useState(false);
  const activeFilters = (cat !== null ? 1 : 0) + (level !== null ? 1 : 0);
  const resetFilters = () => {
    setQuery("");
    setCat(null);
    setLevel(null);
  };

  const nodeRect = useCallback(
    (id: string): Rect | null => {
      const n = placed.get(id);
      return n ? { x: n.x, y: n.y, w: DEFAULT_LAYOUT.nodeW, h: DEFAULT_LAYOUT.nodeH } : null;
    },
    [placed],
  );
  const show = useCallback(
    (rect: Rect, mode: FocusRequest["mode"] = "reveal") => setFocus((f) => ({ rect, mode, n: (f?.n ?? 0) + 1 })),
    [],
  );

  const onSelect = useCallback((id: string) => setPinned((cur) => (cur === id ? null : id)), []);

  const onQuery = (value: string) => {
    setQuery(value);
    const v = value.trim().toLowerCase();
    if (v.length < 2) return;
    const first = nodes.find(
      (n) => visible(n.id) && (cat === null || n.category === cat) && n.name.toLowerCase().includes(v),
    );
    const rect = first && nodeRect(first.id);
    if (rect) show(rect);
  };

  /** Picks a category (dims the rest and brings its block into view) or, on the active chip, turns the filter off. */
  const chooseCat = (id: string) => {
    if (cat === id) {
      setCat(null);
      return;
    }
    setCat(id);
    const b = tree.blocks.find((x) => x.id === id);
    if (b) show({ x: b.x, y: b.y, w: b.w, h: b.h }, "frame");
  };

  const pinAndShow = (id: string) => {
    setPinned(id);
    const rect = nodeRect(id);
    if (rect) show(rect);
  };


  const activeId = pinned ?? hovered;
  const active = activeId ? byId.get(activeId) : undefined;

  // The filter bar. Folded it is one row: search, the "Filters" button (with the number of active filters) and reset;
  // the categories and levels open under it. It sits above the canvas, and over it in full screen.
  const filterBar = (
    <section className="shrink-0 rounded border border-line bg-surface px-2.5 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search field: a magnifier inside on the left (decorative, the field has its own label), the field gets
            room for it; a clear button on the right while there is text (the browser's own one is hidden, it looks
            different in every browser). The icon turns lime while the field is focused. Esc clears too. */}
        <div className="group relative min-w-[12rem] flex-1 sm:max-w-sm">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 group-focus-within:text-accent"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                onQuery("");
              }
            }}
            placeholder={t.search}
            aria-label={t.search}
            autoComplete="off"
            spellCheck={false}
            className="search-input w-full rounded border border-line-2 bg-field py-1.5 pl-8 pr-8 text-sm outline-none placeholder:text-ink-3 focus:border-accent"
          />
          {query && (
            <button
              type="button"
              aria-label={t.clearSearch}
              title={t.clearSearch}
              onClick={() => onQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-3 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="shipment-filters"
          onClick={() => setFiltersOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-surface-2 ${
            activeFilters > 0 ? "text-accent" : "text-ink-2 hover:text-ink"
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 5h16l-6 7.5V19l-4 1v-7.5z" />
          </svg>
          <span className="display">{t.filters}</span>
          {activeFilters > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-ink">
              {activeFilters}
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {anyFilter && <TextButton onClick={resetFilters}>{t.resetFilters}</TextButton>}
        {anyFilter && matches === 0 && <span className="text-sm text-ink-3">{t.noMatches}</span>}
      </div>
      {filtersOpen && (
        <div id="shipment-filters" className="flex flex-wrap gap-x-8">
          {/* Each group has its own small caption on its own line, so both start at the same left edge. */}
          <FilterGroup label={t.categoryFilter}>
            {/* Skewed plates like the header tabs and the "Add to plan" button, each as wide as its name. */}
            <div className="flex flex-wrap gap-1.5">
              {blocks.map((b) => (
                <FilterTab
                  key={b.id}
                  on={cat === b.id}
                  label={b.label}
                  onClick={() => chooseCat(b.id)}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label={t.levelFilter}>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.levelFilter}>
              {[1, 2, 3].map((l) => (
                <FilterTab
                  key={l}
                  on={level === l}
                  label={fill(t.level, l)}
                  onClick={() => setLevel(level === l ? null : l)}
                />
              ))}
            </div>
          </FilterGroup>
        </div>
      )}
    </section>
  );

  return (
    <div className="mt-6 grid min-h-0 flex-1 gap-3 lg:grid-cols-[25rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      {/* The left column is all for the plan; the filters live in a bar over the tree they filter. */}
      <aside className="order-2 flex min-h-0 flex-col lg:order-1">
        <PlanPanel
          t={t}
          locale={locale}
          plan={plan}
          byId={byId}
          onShow={pinAndShow}
          onRemove={(id) => setPicked((p) => removePick(graph, p, id))}
          onReset={() => setPicked(() => new Set())}
          owned={owned}
          onOwned={setOwned}
        />
      </aside>

      <div className="order-1 flex h-[70dvh] min-h-0 flex-col gap-2 lg:order-2 lg:h-auto">
        {!full && filterBar}

        <div className="min-h-0 flex-1">
          <ShipmentTree
          nodes={tree.nodes}
          blocks={tree.blocks}
          width={tree.width}
          height={tree.height}
          locale={locale}
          t={t}
          pinned={pinned}
          related={related}
          inPlan={inPlan}
          picked={picked}
          faded={faded}
          onSelect={onSelect}
          onHover={setHovered}
          focus={focus}
          full={full}
          onFull={setFull}
          toolbar={filterBar}
          overlay={
            active && (
              <ShipmentCard
                node={active}
                graph={graph}
                byId={byId}
                t={t}
                locale={locale}
                pinned={pinned === active.id}
                status={picked.has(active.id) ? "picked" : inPlan.has(active.id) ? "required" : "none"}
                onAdd={() => setPicked((p) => addPick(graph, p, active.id))}
                onRemove={() => setPicked((p) => removePick(graph, p, active.id))}
                onClose={() => setPinned(null)}
              />
            )
          }
        />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded border border-line bg-surface p-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="display text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * A filter button in the site's style: a skewed plate like the header tabs, the display font, no border.
 * As wide as its text, the text on the left. Hover lightens the plate; the active one is lime.
 */
function FilterTab({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`skew px-3 py-1 text-left transition-colors ${
        on ? "bg-accent text-accent-ink hover:brightness-110" : "bg-surface-2 text-ink-2 hover:bg-line-2 hover:text-ink"
      }`}
    >
      <span className="display whitespace-nowrap text-sm">{label}</span>
    </button>
  );
}

/** A group of filters with a small caption above it. */
function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 text-[0.7rem] uppercase tracking-wider text-ink-3">{label}</div>
      {children}
    </div>
  );
}

function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-xs text-ink-3 hover:text-accent">
      {children}
    </button>
  );
}

function Stat({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded bg-field px-2.5 py-1.5 ${wide ? "col-span-3" : ""}`}>
      <div className="truncate text-[0.7rem] text-ink-3">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

interface PlanPanelProps {
  t: Dict["shipments"];
  locale: string;
  plan: ReturnType<typeof computePlan>;
  /** The settlement level the player already has (0 = none). */
  owned: number;
  onOwned: (level: number) => void;
  byId: Map<string, TreeNode>;
  onShow: (id: string) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}

function PlanPanel({ t, locale, plan, byId, onShow, onRemove, onReset, owned, onOwned }: PlanPanelProps) {
  const empty = plan.order.length === 0;
  return (
    <Panel
      title={t.plan}
      className="flex min-h-[10rem] flex-col lg:min-h-0 lg:flex-1"
      action={
        empty ? null : (
          // The full plan page (a bigger table with the tiles) is a separate feature; for now the button does nothing.
          <button
            type="button"
            aria-label={t.openPlan}
            title={t.openPlan}
            aria-disabled="true"
            className="-m-1 p-1 text-ink-3 hover:text-accent"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
          </button>
        )
      }
    >
      {/* The settlement the player already has: the plots up to it are not counted again. Shown even for an empty
          plan, so it can be set first. Exactly one option is always active. */}
      <div className="mb-3 shrink-0">
        <div className="mb-1.5 text-[0.7rem] uppercase tracking-wider text-ink-3">{t.ownedLevel}</div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.ownedLevel}>
          {[0, ...PLOT_PATH.map((_, i) => i + 1)].map((l) => (
            <FilterTab key={l} on={owned === l} label={l === 0 ? t.ownedNone : fill(t.level, l)} onClick={() => onOwned(l)} />
          ))}
        </div>
      </div>
      {empty ? (
        <p className="text-sm text-ink-3">{t.planEmpty}</p>
      ) : (
        <>
          {/* The unlock order first (it takes the free height and scrolls), the totals under it. */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs text-ink-3">{t.openOrder}</h3>
            <TextButton onClick={onReset}>{t.resetPlan}</TextButton>
          </div>
          {/* A table, so the columns line up from row to row: the name takes all the free space (w-full, and
              max-w-0 lets a long name truncate), the number, price and remove button are only as wide as they need (w-px). */}
          <div className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {plan.steps.map(({ id, kind }, i) => {
                  const n = byId.get(id)!;
                  const level = plotLevel(id);
                  return (
                    <tr key={id} className="border-b border-line">
                      <td className="w-px whitespace-nowrap py-1 pr-2 text-right text-xs tabular-nums text-ink-3">{i + 1}</td>
                      <td className="w-full max-w-0 py-1 pr-2">
                        <button type="button" onClick={() => onShow(id)} className="block w-full truncate text-left hover:text-accent">
                          {n.name}
                          {/* The table is tight, so the short form here; everywhere else the full word. */}
                          {level > 0 && <span className="ml-1 text-ink-3">{fill(t.levelShort, level)}</span>}
                          {plan.rented.includes(id) && n.buy !== null && (
                            <span className="ml-1.5 text-xs text-accent">· {t.rentTag.replace("{price}", money(n.buy, locale))}</span>
                          )}
                        </button>
                      </td>
                      <td className="w-px whitespace-nowrap py-1 pr-2 text-left text-xs tabular-nums text-ink-2">
                        {n.cost === 0 ? t.free : money(n.cost, locale)}
                      </td>
                      <td className="w-px py-1 text-center">
                        {kind === "picked" && (
                          <button type="button" aria-label={`${t.removeFromPlan}: ${n.name}`} onClick={() => onRemove(id)} className="w-4 text-ink-3 hover:text-ink">
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid shrink-0 grid-cols-3 gap-1.5">
            <Stat label={t.total} wide>
              <span className="display text-2xl text-accent">{money(plan.total, locale)}</span>
              <span className="block text-xs text-ink-3">
                {t.research} {money(plan.research, locale)}
                {plan.rent > 0 && ` · ${t.rentLabel} ${money(plan.rent, locale)}`}
              </span>
            </Stat>
            <Stat label={t.count}>{plan.order.length}</Stat>
            <Stat label={t.settlement}>{plan.settlement === null ? t.none : fill(t.level, plan.settlement)}</Stat>
            {/* Short one-line caption like the other cards; the value in the same plain style, with "#" as on the tiles. */}
            <Stat label={t.jailShort}>#{plan.jail}</Stat>
          </div>
        </>
      )}
    </Panel>
  );
}

interface CardProps {
  node: TreeNode;
  graph: ShipmentGraph;
  byId: Map<string, TreeNode>;
  t: Dict["shipments"];
  locale: string;
  pinned: boolean;
  status: "picked" | "required" | "none";
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}

function ShipmentCard({ node, graph, byId, t, locale, pinned, status, onAdd, onRemove, onClose }: CardProps) {
  const before = prerequisites(graph, node.id).sort((a, b) => graph.depth.get(a)! - graph.depth.get(b)!);
  const opens = graph.children.get(node.id) ?? [];
  const names = (ids: readonly string[]) => ids.map((id) => byId.get(id)?.name ?? id);
  return (
    // A card shown on hover must not catch the pointer, or it would flicker under the mouse.
    <section
      className={`rounded border border-line-2 bg-surface/95 p-3 shadow-xl backdrop-blur ${pinned ? "" : "pointer-events-none"}`}
      style={{ borderTop: `3px solid var(--color-r${node.rarity})` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="display text-xl leading-tight">{node.name}</h2>
          <p className="text-xs text-ink-3">
            {t.categories[node.category] ?? node.category}
            {node.tier !== null && ` · ${fill(t.settlementLevel, node.tier)}`}
            {node.tier !== null && <span className="sr-only"> ({ROMAN[node.tier]})</span>}
          </p>
        </div>
        {/* Always in the layout, only hidden on hover, so the card keeps its size when pinned. */}
        <button
          type="button"
          aria-label={t.close}
          onClick={onClose}
          tabIndex={pinned ? undefined : -1}
          className={`-m-1 p-1 text-lg leading-none text-ink-3 hover:text-ink ${pinned ? "" : "invisible"}`}
        >
          ×
        </button>
      </div>
      {/* The item description from the game, right under the heading. Long ones are cut at four lines. */}
      {node.description && <p className="mt-1.5 line-clamp-4 text-sm text-ink-2">{node.description}</p>}
      <dl className="mt-2 text-sm">
        <div className="flex justify-between gap-3 border-b border-line py-1">
          <dt className="text-ink-3">{t.research}</dt>
          <dd className="display text-accent">{node.cost === 0 ? t.free : money(node.cost, locale)}</dd>
        </div>
        {node.buy !== null && (
          <div className="flex justify-between gap-3 border-b border-line py-1">
            <dt className="text-ink-3">{t.buy}</dt>
            <dd>{money(node.buy, locale)}</dd>
          </div>
        )}
        {node.jail > 0 && (
          <div className="flex justify-between gap-3 border-b border-line py-1">
            <dt className="text-ink-3">{t.jail}</dt>
            <dd>{node.jail}</dd>
          </div>
        )}
      </dl>
      {before.length > 0 && (
        <p className="mt-2 text-sm">
          <span className="text-ink-3">{t.requires}: </span>
          <span className="text-ink-2">{names(before).join(" → ")}</span>
        </p>
      )}
      {opens.length > 0 && (
        <p className="mt-1 text-sm">
          <span className="text-ink-3">{t.opens}: </span>
          <span className="text-ink-2">{names(opens).join(", ")}</span>
        </p>
      )}
      {/* The action row is the same on hover and when pinned: the card must not jump on a click.
          On hover the card ignores the pointer, so the buttons only work once the shipment is pinned. */}
      <div className="mt-3 flex items-center gap-3">
        {status === "picked" ? (
          <button
            type="button"
            onClick={onRemove}
            tabIndex={pinned ? undefined : -1}
            className="skew border border-line-2 px-3 py-1.5 text-sm text-ink-2 hover:text-ink"
          >
            <span className="display">{t.removeFromPlan}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            tabIndex={pinned ? undefined : -1}
            className="skew border border-accent bg-accent px-3 py-1.5 text-sm text-accent-ink"
          >
            <span className="display">{t.addToPlan}</span>
          </button>
        )}
        {status === "required" && <span className="text-xs text-ink-3">{t.neededForPlan}</span>}
        <Link
          href={`/${locale}${node.itemPath}`}
          tabIndex={pinned ? undefined : -1}
          className="ml-auto text-sm text-accent hover:underline"
        >
          {t.itemPage} →
        </Link>
      </div>
    </section>
  );
}
