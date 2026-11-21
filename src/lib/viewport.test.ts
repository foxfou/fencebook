import { describe, expect, it } from "vitest";
import { centerOn, clamp, constrainView, fitView, frameView, isVisible, zoomAt, type View } from "./viewport";

const screenOf = (v: View, wx: number, wy: number) => ({ x: v.x + wx * v.k, y: v.y + wy * v.k });

describe("zoomAt", () => {
  it("keeps the world point under the cursor where it was", () => {
    const v: View = { x: 30, y: -20, k: 0.5 };
    const cx = 400;
    const cy = 250;
    const world = { x: (cx - v.x) / v.k, y: (cy - v.y) / v.k };
    const z = zoomAt(v, 1.6, cx, cy, 0.1, 4);
    expect(z.k).toBeCloseTo(0.8);
    const s = screenOf(z, world.x, world.y);
    expect(s.x).toBeCloseTo(cx);
    expect(s.y).toBeCloseTo(cy);
  });

  it("stops at the limits and does not drift when it is already there", () => {
    const v: View = { x: 10, y: 10, k: 2 };
    expect(zoomAt(v, 5, 100, 100, 0.1, 2)).toEqual(v);
    expect(zoomAt({ x: 0, y: 0, k: 0.1 }, 0.1, 50, 50, 0.1, 2).k).toBe(0.1);
  });
});

describe("fitView", () => {
  it("scales the content to fit and centres it", () => {
    const v = fitView({ w: 1000, h: 500 }, { w: 500, h: 500 }, 0, 1);
    expect(v.k).toBe(0.5);
    expect(v.x).toBe(0);
    expect(v.y).toBe((500 - 250) / 2);
  });

  it("respects the padding", () => {
    const v = fitView({ w: 1000, h: 1000 }, { w: 600, h: 600 }, 50, 1);
    expect(v.k).toBeCloseTo(0.5);
    expect(v.x).toBeCloseTo(50);
  });

  it("does not zoom in past maxK for small content", () => {
    expect(fitView({ w: 10, h: 10 }, { w: 800, h: 600 }, 0, 1).k).toBe(1);
  });
});

describe("frameView", () => {
  it("fits the rectangle into the viewport and centres it", () => {
    const rect = { x: 1000, y: 500, w: 800, h: 400 };
    const v = frameView(rect, { w: 400, h: 400 }, 0, 1);
    expect(v.k).toBe(0.5);
    expect(screenOf(v, rect.x, rect.y)).toEqual({ x: 0, y: 100 });
    expect(screenOf(v, rect.x + rect.w, rect.y + rect.h)).toEqual({ x: 400, y: 300 });
  });

  it("does not zoom in past maxK for a small rectangle", () => {
    const v = frameView({ x: 50, y: 50, w: 10, h: 10 }, { w: 800, h: 600 }, 0, 1);
    expect(v.k).toBe(1);
    expect(screenOf(v, 55, 55)).toEqual({ x: 400, y: 300 });
  });
});

describe("centerOn", () => {
  it("puts the world point in the middle of the viewport without changing the scale", () => {
    const v = centerOn({ x: 0, y: 0, k: 0.5 }, { x: 400, y: 200 }, { w: 800, h: 600 });
    expect(v.k).toBe(0.5);
    expect(screenOf(v, 400, 200)).toEqual({ x: 400, y: 300 });
  });
});

describe("constrainView", () => {
  const content = { w: 1000, h: 1000 };
  const viewport = { w: 800, h: 600 };

  it("leaves a view that is inside the limits alone", () => {
    const v: View = { x: 100, y: 50, k: 1 };
    expect(constrainView(v, content, viewport, 80)).toEqual(v);
  });

  it("keeps a margin of the content on screen when dragged far away", () => {
    const far = constrainView({ x: 5000, y: -5000, k: 1 }, content, viewport, 80);
    expect(far.x).toBe(800 - 80);
    expect(far.y).toBe(80 - 1000);
    const left = constrainView({ x: -9000, y: 9000, k: 0.5 }, content, viewport, 80);
    expect(left.x).toBe(80 - 500);
    expect(left.y).toBe(600 - 80);
  });
});

describe("isVisible", () => {
  const viewport = { w: 800, h: 600 };
  it("tells whether a rectangle is fully on screen", () => {
    const v: View = { x: 0, y: 0, k: 1 };
    expect(isVisible(v, { x: 10, y: 10, w: 100, h: 100 }, viewport)).toBe(true);
    expect(isVisible(v, { x: 750, y: 10, w: 100, h: 100 }, viewport)).toBe(false);
    expect(isVisible(v, { x: 10, y: 10, w: 100, h: 100 }, viewport, 20)).toBe(false);
  });
  it("accounts for the scale and the offset", () => {
    const v: View = { x: -500, y: 0, k: 0.5 };
    expect(isVisible(v, { x: 1100, y: 100, w: 100, h: 100 }, viewport)).toBe(true);
    expect(isVisible(v, { x: 100, y: 100, w: 100, h: 100 }, viewport)).toBe(false);
  });
});

describe("clamp", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});
