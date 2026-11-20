import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { LocaleSwitch } from "./LocaleSwitch";

export function Header({ locale, t }: { locale: string; t: Dict }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3">
        <Link href={`/${locale}`} className="flex items-baseline gap-2">
          <span className="display text-2xl text-ink">{t.brand}</span>
          <span className="display text-2xl text-accent">{t.brandSub}</span>
        </Link>
        <nav className="ml-2 flex gap-2">
          <Link href={`/${locale}`} className="skew bg-accent px-4 py-1.5 text-accent-ink">
            <span className="display text-lg">{t.nav.items}</span>
          </Link>
        </nav>
        <div className="ml-auto">
          <LocaleSwitch locale={locale} />
        </div>
      </div>
    </header>
  );
}
