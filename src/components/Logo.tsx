import { BRAND_PARTS } from "@/lib/site";

/**
 * Brand mark: a slanted lime plate with a dark "F", like the game's skewed buttons.
 * The same shapes are used for the favicon (src/app/icon.svg) and the link previews (src/lib/og.tsx).
 */
export const MARK_PATHS = {
  plate: "M8 2h22l-6 28H2z",
  // "F" outline with the same slant as the plate (x shifts left by 0.2125 per unit of y)
  letter: "M12 8H24L23.26 11.5H15.86L15.22 14.5H21L20.26 18H14.48L13.2 24H8.6Z",
} as const;

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <path d={MARK_PATHS.plate} fill="var(--color-accent)" />
      <path d={MARK_PATHS.letter} fill="var(--color-bg)" />
    </svg>
  );
}

/** Full logo: mark, two-tone wordmark and a small caption. */
export function Logo({ tag }: { tag: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="display text-[1.55rem] leading-[0.9] tracking-[0.01em]">
          <span className="text-ink">{BRAND_PARTS[0]}</span>
          <span className="text-accent">{BRAND_PARTS[1]}</span>
        </span>
        <span className="mt-1 hidden whitespace-nowrap text-[0.6rem] font-medium uppercase tracking-[0.2em] text-ink-3 sm:block">
          {tag}
        </span>
      </span>
    </span>
  );
}
