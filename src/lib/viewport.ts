// Pan and zoom maths for the shipments tree. Pure functions, so they are unit tested; the pointer handling is in usePanZoom.
// A world point (wx, wy) is on screen at (x + wx * k, y + wy * k).

export interface View {
  x: number;
  y: number;
  /** Scale. */
  k: number;
}

export interface Size {
  w: number;
  h: number;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Zooms by `factor` keeping the world point under the screen point (cx, cy) where it is. */
export function zoomAt(view: View, factor: number, cx: number, cy: number, minK: number, maxK: number): View {
  const k = clamp(view.k * factor, minK, maxK);
  const r = k / view.k;
  return { k, x: cx - (cx - view.x) * r, y: cy - (cy - view.y) * r };
}

/** The view that shows the whole content, centred. Never zooms in past `maxK`. */
export function fitView(content: Size, viewport: Size, padding = 24, maxK = 1): View {
  const k = clamp(
    Math.min((viewport.w - 2 * padding) / content.w, (viewport.h - 2 * padding) / content.h),
    0.01,
    maxK,
  );
  return { k, x: (viewport.w - content.w * k) / 2, y: (viewport.h - content.h * k) / 2 };
}

/** The view that fits a world rectangle into the viewport, centred. Never zooms in past `maxK`. */
export function frameView(rect: { x: number; y: number; w: number; h: number }, viewport: Size, padding = 24, maxK = 1): View {
  const f = fitView({ w: rect.w, h: rect.h }, viewport, padding, maxK);
  return { k: f.k, x: f.x - rect.x * f.k, y: f.y - rect.y * f.k };
}

/** Moves the view so the world point is in the middle of the viewport. */
export function centerOn(view: View, point: { x: number; y: number }, viewport: Size): View {
  return { k: view.k, x: viewport.w / 2 - point.x * view.k, y: viewport.h / 2 - point.y * view.k };
}

/** Keeps at least `margin` pixels of the content on screen, so it cannot be dragged away. */
export function constrainView(view: View, content: Size, viewport: Size, margin = 80): View {
  const w = content.w * view.k;
  const h = content.h * view.k;
  return {
    k: view.k,
    x: clamp(view.x, margin - w, viewport.w - margin),
    y: clamp(view.y, margin - h, viewport.h - margin),
  };
}

/** True when the world rectangle is fully inside the viewport (with `margin` to spare). */
export function isVisible(view: View, rect: { x: number; y: number; w: number; h: number }, viewport: Size, margin = 0): boolean {
  const left = view.x + rect.x * view.k;
  const top = view.y + rect.y * view.k;
  return (
    left >= margin &&
    top >= margin &&
    left + rect.w * view.k <= viewport.w - margin &&
    top + rect.h * view.k <= viewport.h - margin
  );
}
