import { manifest } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";

export function Footer({ t }: { t: Dict }) {
  return (
    // site-footer / site-footer-inner: on full-screen tool pages (data-app-page) the footer shrinks to one line, see globals.css.
    <footer className="site-footer mt-12 border-t border-line">
      <div className="site-footer-inner mx-auto max-w-[1500px] space-y-1 px-4 py-6 text-sm text-ink-3">
        <p>{t.footer.disclaimer}</p>
        <p>
          {t.footer.data} {manifest.game.buildid}
        </p>
      </div>
    </footer>
  );
}
