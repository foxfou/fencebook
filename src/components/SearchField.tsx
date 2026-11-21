"use client";

/**
 * Search field used on every page with a search (items, shipments): a magnifier inside on the left (decorative,
 * the field has its own label), a clear button on the right while there is text (the browser's own one is hidden,
 * it looks different in every browser). The icon turns lime while the field is focused. Esc clears too.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  clearLabel,
  className = "",
  inputClassName = "py-1.5 text-sm",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  /** Classes of the wrapper (width, flex). */
  className?: string;
  /** Size of the field: padding and text size. */
  inputClassName?: string;
}) {
  return (
    <div className={`group relative ${className}`}>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`search-input w-full rounded border border-line-2 bg-field pl-8 pr-8 text-ink outline-none placeholder:text-ink-3 focus:border-accent ${inputClassName}`}
      />
      {value && (
        <button
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-3 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
