/**
 * Title and lead of a section page. Every section (items, shipments, …) uses this one component,
 * so the headings look the same everywhere and the page structure cannot drift apart.
 */
export function PageHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="shrink-0">
      <h1 className="display text-4xl">{title}</h1>
      {lead && <p className="mt-1 max-w-3xl text-ink-2">{lead}</p>}
    </div>
  );
}

/** Width and padding of a section page: the same as the header, so the content lines up with the logo. */
export const PAGE_CONTAINER = "mx-auto w-full max-w-[1500px] px-4 py-6";
