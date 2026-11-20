import Link from "next/link";

// The language is unknown here, so the message is bilingual.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-16">
      <h1 className="display text-5xl">404</h1>
      <p className="mt-2 text-ink-2">Страница не найдена · Page not found</p>
      <div className="mt-6 flex gap-2">
        <Link href="/ru" className="skew bg-accent px-4 py-1.5 text-accent-ink">
          <span className="display">RU</span>
        </Link>
        <Link href="/en" className="skew bg-surface-2 px-4 py-1.5 text-ink">
          <span className="display">EN</span>
        </Link>
      </div>
    </div>
  );
}
