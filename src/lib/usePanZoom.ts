"use client";

// Pan and zoom for a big canvas: wheel zooms to the cursor, a drag pans, two fingers pinch, keys + - 0 and arrows work.
// The transform is written straight to the DOM, so panning does not re-render React; only the rounded scale is state.
import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { centerOn, constrainView, fitView, frameView, isVisible, zoomAt, type Size, type View } from "./viewport";

const DRAG_THRESHOLD = 5;
const MAX_K = 2;
const KEY_PAN = 80;
/** Narrower than this is a phone: the first view is zoomed to PHONE_K instead of fitting everything. */
const PHONE_WIDTH = 640;
const PHONE_K = 0.45;

interface Point {
  x: number;
  y: number;
}

export interface PanZoom {
  /** Put as `ref` on the element that clips the canvas. */
  viewport: RefObject<HTMLDivElement | null>;
  /** Put as `ref` on the element that holds the content and gets the transform. */
  layer: RefObject<HTMLDivElement | null>;
  /** Scale rounded to 1%, for the label. */
  scale: number;
  /** True once the first fit is applied. */
  ready: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  /** Scrolls a world rectangle into view if it is not fully visible. */
  reveal: (rect: { x: number; y: number; w: number; h: number }) => void;
  /** Moves and zooms so the world rectangle fills the view. */
  frame: (rect: { x: number; y: number; w: number; h: number }) => void;
  /** Swallows the click that ends a drag. Put it on the viewport element. */
  onClickCapture: (e: MouseEvent) => void;
}

export function usePanZoom(content: Size): PanZoom {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const view = useRef<View>({ x: 0, y: 0, k: 1 });
  const minK = useRef(0.05);
  const touched = useRef(false);
  const dragged = useRef(false);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  const size = useCallback((): Size => {
    const el = viewportRef.current;
    return { w: el?.clientWidth ?? 0, h: el?.clientHeight ?? 0 };
  }, []);

  const apply = useCallback(
    (next: View) => {
      const v = constrainView(next, content, size());
      view.current = v;
      const layer = layerRef.current;
      if (layer) layer.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.k})`;
      setScale(Math.round(v.k * 100) / 100);
    },
    [content, size],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const s = size();
      touched.current = true;
      apply(zoomAt(view.current, factor, s.w / 2, s.h / 2, minK.current, MAX_K));
    },
    [apply, size],
  );

  /** The whole content in view. `initial` is the first view: on a phone the whole tree would be too small to read, so it starts at a readable scale in the corner. */
  const showAll = useCallback(
    (initial: boolean) => {
      const s = size();
      if (s.w === 0 || s.h === 0) return;
      const f = fitView(content, s, 24, 1);
      minK.current = Math.min(f.k * 0.8, 0.5);
      touched.current = false;
      apply(initial && s.w < PHONE_WIDTH ? { k: Math.max(f.k, PHONE_K), x: 16, y: 16 } : f);
    },
    [apply, content, size],
  );
  const fit = useCallback(() => showAll(false), [showAll]);

  const reveal = useCallback(
    (rect: { x: number; y: number; w: number; h: number }) => {
      const s = size();
      if (isVisible(view.current, rect, s, 24)) return;
      touched.current = true;
      const k = Math.max(view.current.k, 0.6);
      apply(centerOn({ ...view.current, k }, { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }, s));
    },
    [apply, size],
  );

  /** Moves and zooms so the world rectangle fills the view. */
  const frame = useCallback(
    (rect: { x: number; y: number; w: number; h: number }) => {
      const s = size();
      if (s.w === 0 || s.h === 0) return;
      touched.current = true;
      apply(frameView(rect, s, 24, 1));
    },
    [apply, size],
  );

  // First fit, and a refit on resize until the user has moved the view themselves.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    showAll(true);
    setReady(true);
    const ro = new ResizeObserver(() => {
      if (!touched.current) showAll(true);
      else apply(view.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [showAll, apply]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const local = (e: { clientX: number; clientY: number }): Point => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    // Controls and panels over the canvas are marked data-no-pan: scrolling or pressing there must not move the tree.
    const onControl = (e: Event) => e.target instanceof Element && e.target.closest("[data-no-pan]") !== null;

    const onWheel = (e: WheelEvent) => {
      if (onControl(e)) return;
      e.preventDefault();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      const p = local(e);
      touched.current = true;
      apply(zoomAt(view.current, Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015)), p.x, p.y, minK.current, MAX_K));
    };

    const pointers = new Map<number, Point>();
    let panFrom: { pointer: Point; view: View } | null = null;
    let pinchFrom: { dist: number; mid: Point; view: View } | null = null;
    let moved = false;

    const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
    const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (onControl(e)) return;
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 1) {
        panFrom = { pointer: local(e), view: view.current };
        moved = false;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchFrom = { dist: dist(a, b) || 1, mid: mid(a, b), view: view.current };
        panFrom = null;
        moved = true;
        dragged.current = true;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, local(e));
      if (pointers.size >= 2 && pinchFrom) {
        const [a, b] = [...pointers.values()];
        const m = mid(a, b);
        const z = zoomAt(pinchFrom.view, dist(a, b) / pinchFrom.dist, pinchFrom.mid.x, pinchFrom.mid.y, minK.current, MAX_K);
        touched.current = true;
        apply({ ...z, x: z.x + (m.x - pinchFrom.mid.x), y: z.y + (m.y - pinchFrom.mid.y) });
      } else if (panFrom) {
        const p = local(e);
        const dx = p.x - panFrom.pointer.x;
        const dy = p.y - panFrom.pointer.y;
        if (!moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          moved = true;
          dragged.current = true;
          // Capture only now, so a plain click still reaches the shipment under the pointer.
          el.setPointerCapture(e.pointerId);
        }
        if (moved) {
          touched.current = true;
          apply({ ...panFrom.view, x: panFrom.view.x + dx, y: panFrom.view.y + dy });
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinchFrom = null;
      if (pointers.size === 1) {
        // One finger is left after a pinch: continue as a pan from where it is, without a jump.
        panFrom = { pointer: [...pointers.values()][0], view: view.current };
      } else if (pointers.size === 0) {
        panFrom = null;
        // The click that follows pointerup must still see `dragged`; clear it afterwards.
        setTimeout(() => {
          dragged.current = false;
        }, 0);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target !== el) return;
      const move = (dx: number, dy: number) => {
        e.preventDefault();
        touched.current = true;
        apply({ ...view.current, x: view.current.x + dx, y: view.current.y + dy });
      };
      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          zoomBy(1.25);
          break;
        case "-":
        case "_":
          e.preventDefault();
          zoomBy(0.8);
          break;
        case "0":
          e.preventDefault();
          fit();
          break;
        case "ArrowLeft":
          move(KEY_PAN, 0);
          break;
        case "ArrowRight":
          move(-KEY_PAN, 0);
          break;
        case "ArrowUp":
          move(0, KEY_PAN);
          break;
        case "ArrowDown":
          move(0, -KEY_PAN);
          break;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("keydown", onKey);
    };
  }, [apply, fit, zoomBy]);

  const onClickCapture = useCallback((e: MouseEvent) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  return {
    viewport: viewportRef,
    layer: layerRef,
    scale,
    ready,
    zoomIn: () => zoomBy(1.25),
    zoomOut: () => zoomBy(0.8),
    fit,
    reveal,
    frame,
    onClickCapture,
  };
}
