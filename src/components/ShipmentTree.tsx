"use client";

import { memo, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { money } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { DEFAULT_LAYOUT, edgePath } from "@/lib/shipmentLayout";
import type { ShipmentNode } from "@/lib/shipments";
import { usePanZoom } from "@/lib/usePanZoom";
import { Vignette } from "./Vignette";

/** A shipment ready to draw: the graph data plus the name, rarity and position. */
export interface TreeNode extends ShipmentNode {
  name: string;
  /** Path of the item page without the language prefix: "/items/<slug>". */
  itemPath: string;
  /** Item description from the game, in the page language; "" if there is none. */
  description: string;
  hasIcon: boolean;
  rarity: number;
  /** Top-left corner on the canvas. */
  x: number;
  y: number;
}

export interface TreeBlock {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FocusRequest {
  rect: Rect;
  mode: "reveal" | "frame";
  n: number;
}

interface Props {
  nodes: TreeNode[];
  blocks: TreeBlock[];
  width: number;
  height: number;
  locale: string;
  t: Dict["shipments"];
  /** The shipment the player clicked. */
  pinned: string | null;
  /** The path to the pinned shipment: it and everything that has to be unlocked before it. */
  related: ReadonlySet<string> | null;
  /** Everything in the plan, prerequisites included. */
  inPlan: ReadonlySet<string>;
  /** What the player chose themselves. */
  picked: ReadonlySet<string>;
  /** Shipments the filters rule out; they are dimmed. Null when no filter is on. */
  faded: ReadonlySet<string> | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /**
   * A request to move the view, handled when it changes (`n` makes every request new).
   * "reveal" scrolls the rectangle into view only if it is hidden; "frame" zooms so it fills the view.
   */
  focus: FocusRequest | null;
  /** Shown in the bottom-left corner of the view (the shipment card), also in full screen. */
  overlay?: ReactNode;
  /** Full screen mode, controlled by the page. */
  full: boolean;
  onFull: (full: boolean) => void;
  /** Shown along the top of the canvas in full screen only (the filter bar; normally it sits above the canvas). */
  toolbar?: ReactNode;
}

type State = "idle" | "pinned" | "related" | "dim";
type PlanMark = "picked" | "required" | undefined;

const ROMAN = ["", "I", "II", "III"];
const { nodeW, nodeH } = DEFAULT_LAYOUT;

interface TileProps {
  node: TreeNode;
  state: State;
  plan: PlanMark;
  cost: string;
  /** Caption for the jail term badge ("Нужен срок в тюрьме"). */
  jailLabel: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onReveal: (rect: Rect) => void;
}

const Tile = memo(function Tile({ node, state, plan, cost, jailLabel, onSelect, onHover, onReveal }: TileProps) {
  return (
    <button
      type="button"
      data-node={node.id}
      data-dim={state === "dim" ? "true" : undefined}
      data-related={state === "related" ? "true" : undefined}
      data-plan={plan}
      aria-pressed={state === "pinned"}
      aria-label={`${node.name}, ${cost}`}
      className="snode"
      style={{ left: node.x, top: node.y, width: nodeW, height: nodeH, "--r": `var(--color-r${node.rarity})` } as CSSProperties}
      onClick={() => onSelect(node.id)}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(node.id)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
      onFocus={() => onReveal({ x: node.x, y: node.y, w: nodeW, h: nodeH })}
    >
      <span className="snode-tile">
        {node.hasIcon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/icons/${node.item}.png`} alt="" loading="lazy" decoding="async" draggable={false} />
        )}
        {node.tier !== null && <span className="snode-tier">{ROMAN[node.tier]}</span>}
        {plan === "picked" && <span className="snode-check">✓</span>}
        {node.jail > 0 && (
          <span className="snode-jail" title={`${jailLabel}: ${node.jail}`}>
            #{node.jail}
          </span>
        )}
      </span>
      {/* Price right under the icon, the name last: prices of a row line up whatever the length of the names. */}
      <span className="snode-cost">{cost}</span>
      <span className="snode-name">{node.name}</span>
    </button>
  );
});

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mx-auto block">
      <path d={d} />
    </svg>
  );
}

/** The pannable and zoomable canvas with the whole tree. State and the side panel live in ShipmentPlanner. */
export function ShipmentTree({ nodes, blocks, width, height, locale, t, pinned, related, inPlan, picked, faded, onSelect, onHover, focus, overlay, full, onFull, toolbar }: Props) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const content = useMemo(() => ({ w: width, h: height }), [width, height]);
  const { viewport, layer, scale, ready, zoomIn, zoomOut, fit, reveal, frame, onClickCapture } = usePanZoom(content);

  // Each request is handled once. When the tree is rebuilt (the level filter), `frame` and `reveal` change,
  // and without this check the last request would run again against the new layout.
  const handledFocus = useRef(0);
  useEffect(() => {
    if (!focus || focus.n === handledFocus.current) return;
    handledFocus.current = focus.n;
    if (focus.mode === "frame") frame(focus.rect);
    else reveal(focus.rect);
  }, [focus, reveal, frame]);

  // Full screen: the same canvas becomes a dialog over the whole window, so the zoom and position are kept.
  // The state belongs to the page (it shows the filters over the canvas in full screen).
  useEffect(() => {
    if (!full) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    viewport.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Esc in the search field clears the text first (it marks the event as handled); only a plain Esc leaves full screen.
      if (e.key === "Escape" && !e.defaultPrevented) onFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [full, onFull, viewport]);

  const costs = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.cost === 0 ? t.free : money(n.cost, locale)])),
    [nodes, locale, t.free],
  );

  const edges = useMemo(
    () =>
      nodes.flatMap((n) =>
        n.requires.map((r) => ({ key: `${r}>${n.id}`, from: r, to: n.id, d: edgePath(byId.get(r)!, n) })),
      ),
    [nodes, byId],
  );

  const stateOf = (id: string): State => {
    if (id === pinned) return "pinned";
    if (related) return related.has(id) ? "related" : "dim";
    return faded?.has(id) ? "dim" : "idle";
  };

  return (
    <div
      ref={viewport}
      tabIndex={0}
      role={full ? "dialog" : "region"}
      aria-modal={full ? true : undefined}
      aria-label={t.canvasLabel}
      onClickCapture={onClickCapture}
      onClick={(e) => {
        // A click on empty canvas unpins; clicks on a shipment or inside the card and the controls do not.
        const target = e.target as Element;
        if (!target.closest("[data-node]") && !target.closest("[data-no-pan]") && pinned) onSelect(pinned);
      }}
      onScroll={(e) => e.currentTarget.scrollTo(0, 0)}
      className={`shipment-viewport cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing ${
        full ? "fixed inset-0 z-50" : "relative h-full min-h-[420px] rounded border border-line"
      }`}
    >
      {/* --color-surface in the middle, fading to the page background (--color-bg) in the corners. */}
      <Vignette color="#1a1816" edge="#12110f" />
      <div
        ref={layer}
        className="snode-layer absolute left-0 top-0 origin-top-left"
        style={{ width, height, opacity: ready ? 1 : 0 }}
      >
        {blocks.map((b) => (
          <section key={b.id} className="sblock" style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
            <h2 className="display">{b.label}</h2>
          </section>
        ))}

        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={width} height={height} aria-hidden="true">
          {edges.map((e) => {
            // Dimmed like the tiles: by the pinned chain if there is one, otherwise by the filters.
            // A dimmed connector is never lime, even if both ends are in the plan.
            const pinOn = related ? related.has(e.from) && related.has(e.to) : false;
            const dim = related ? !pinOn : faded !== null && (faded.has(e.from) || faded.has(e.to));
            const planOn = !related && !dim && inPlan.has(e.from) && inPlan.has(e.to);
            const on = pinOn || planOn;
            return (
              <path
                key={e.key}
                d={e.d}
                fill="none"
                strokeLinejoin="round"
                stroke={on ? "var(--color-accent)" : "var(--color-line-2)"}
                strokeWidth={on ? 3 : 2}
                opacity={dim ? 0.25 : 1}
              />
            );
          })}
        </svg>

        {nodes.map((n) => (
          <Tile
            key={n.id}
            node={n}
            state={stateOf(n.id)}
            plan={picked.has(n.id) ? "picked" : inPlan.has(n.id) ? "required" : undefined}
            cost={costs.get(n.id)!}
            jailLabel={t.jail}
            onSelect={onSelect}
            onHover={onHover}
            onReveal={reveal}
          />
        ))}
      </div>

      {full && toolbar && (
        <div data-no-pan className="absolute left-3 right-3 top-3 z-10 shadow-xl">
          {toolbar}
        </div>
      )}

      {overlay && (
        <div data-no-pan className="absolute bottom-3 left-3 z-10 w-[min(22rem,calc(100%-1.5rem))]">
          {overlay}
        </div>
      )}

      {/* On a phone the card takes the bottom, so the zoom buttons move to the top right
          (in full screen the filter bar is at the top, so they stay at the bottom). */}
      <div
        className={`absolute right-3 z-10 flex items-center gap-1 ${full ? "bottom-3" : "top-3 sm:bottom-3 sm:top-auto"}`}
        data-no-pan
      >
        <span className="mr-1 text-xs tabular-nums text-ink-3" aria-live="off">
          {Math.round(scale * 100)}%
        </span>
        <button type="button" className="zoom-btn" aria-label={t.zoomOut} onClick={zoomOut}>
          −
        </button>
        <button type="button" className="zoom-btn" aria-label={t.zoomIn} onClick={zoomIn}>
          +
        </button>
        <button type="button" className="zoom-btn" aria-label={t.fit} title={t.fit} onClick={fit}>
          <Icon d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
        </button>
        <button
          type="button"
          className="zoom-btn"
          aria-label={full ? t.exitFullscreen : t.fullscreen}
          title={full ? t.exitFullscreen : t.fullscreen}
          aria-pressed={full}
          onClick={() => onFull(!full)}
        >
          {full ? <Icon d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" /> : <Icon d="M4 9V4h5M4 4l6 6M20 9V4h-5M20 4l-6 6M4 15v5h5M4 20l6-6M20 15v5h-5M20 20l-6-6" />}
        </button>
      </div>
    </div>
  );
}
