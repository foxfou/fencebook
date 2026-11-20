import { manifest } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";

export function Footer({ t }: { t: Dict }) {
  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto max-w-[1500px] space-y-1 px-4 py-6 text-sm text-ink-3">
        <p>{t.footer.disclaimer}</p>
        <p>
          {t.footer.data} {manifest.game.buildid}
        </p>
      </div>
    </footer>
  );
}
