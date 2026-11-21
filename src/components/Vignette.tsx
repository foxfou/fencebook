"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** Colour in the middle of the window, #rrggbb. */
  color: string;
  /** Colour the far corners fade to, #rrggbb. The page background, so the window never looks like a hole. */
  edge: string;
  /** Where the fade starts and ends, as a distance from the centre: 1 is the middle of a side, about 1.41 a corner. */
  from?: number;
  to?: number;
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/**
 * The background of the shipments tree: a soft elliptical vignette painted pixel by pixel on a canvas.
 *
 * Shape: the distance from the centre is measured on an ellipse that follows the window's proportions, so the
 * light is round and has no corners or straight edges. The fade starts well away from the centre and eases in
 * and out (smoothstep), and it goes from the window colour to the page background, not to black.
 *
 * Why a canvas: a dark gradient has only a few colour levels, and an 8-bit screen shows them as stripes (banding);
 * a CSS gradient or blurred shadow cannot avoid that. Here every pixel gets its exact colour plus a random offset
 * of up to ±1 level before rounding (triangular dither), so the steps dissolve.
 *
 * Drawn in real screen pixels (up to 2x) and redrawn on resize, for example when entering full screen.
 */
export function Vignette({ color, edge, from = 0.55, to = 1.45 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const inner = rgb(color);
    const outer = rgb(edge);
    let frame = 0;

    const draw = () => {
      frame = 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(parent.clientWidth * dpr);
      const h = Math.round(parent.clientHeight * dpr);
      if (w === 0 || h === 0) return;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // A fast pseudo-random generator (xorshift32): millions of numbers per redraw.
      let seed = 0x9e3779b9;
      const rand = () => {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return (seed >>> 0) / 4294967296;
      };

      // Squared distances from the centre along each axis, in "half sizes" (1 = the middle of a side).
      const ux = new Float32Array(w);
      for (let x = 0; x < w; x++) ux[x] = ((x + 0.5 - w / 2) / (w / 2)) ** 2;
      const uy = new Float32Array(h);
      for (let y = 0; y < h; y++) uy[y] = ((y + 0.5 - h / 2) / (h / 2)) ** 2;
      const span = to - from;

      const img = ctx.createImageData(w, h);
      const px = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const t = Math.min(Math.max((Math.sqrt(ux[x] + uy[y]) - from) / span, 0), 1);
          const s = t * t * (3 - 2 * t); // smoothstep: no visible start or end of the fade
          const i = (y * w + x) * 4;
          // One triangular offset (-1..1 level) for the three channels: it shifts brightness, adds no colour noise.
          const dither = rand() + rand() - 1;
          px[i] = Math.round(inner[0] + (outer[0] - inner[0]) * s + dither);
          px[i + 1] = Math.round(inner[1] + (outer[1] - inner[1]) * s + dither);
          px[i + 2] = Math.round(inner[2] + (outer[2] - inner[2]) * s + dither);
          px[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(schedule);
    ro.observe(parent);
    return () => {
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [color, edge, from, to]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
}
