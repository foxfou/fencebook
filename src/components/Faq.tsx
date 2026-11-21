/** Questions and answers under the catalog: what the numbers mean, for people and for informational searches. */
export function Faq({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="display mb-4 text-lg leading-none">{title}</h2>
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {items.map((f) => (
          <div key={f.q}>
            <h3 className="font-semibold text-ink">{f.q}</h3>
            <p className="mt-1 text-ink-2">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
