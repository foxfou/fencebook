"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import "./globals.css";

/** Status of the document response this tab loaded (Chromium and Firefox; 0 where unknown). */
function documentStatus(): number {
  const nav = performance.getEntriesByType("navigation")[0] as (PerformanceNavigationTiming & { responseStatus?: number }) | undefined;
  return nav?.responseStatus ?? 0;
}

/**
 * Development only: when a code change breaks the page for a moment, Next.js reloads the tab, and if the reload lands
 * while the code is still broken, the tab is left on this error page for good. Here the tab waits for the server to
 * render the page again and then reloads by itself.
 * Only when the page itself came back as a server error: a client-side error would just reload over and over.
 */
function useReloadWhenServerRecovers() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || documentStatus() < 500) return;
    let stopped = false;
    const check = async () => {
      if (stopped) return;
      try {
        const res = await fetch(window.location.href, { cache: "no-store" });
        if (res.ok) {
          window.location.reload();
          return;
        }
      } catch {
        /* the server is restarting: keep waiting */
      }
      setTimeout(check, 1000);
    };
    const timer = setTimeout(check, 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);
}

// Replaces the root layout when it fails, so the language is unknown: the text is bilingual, like the 404 page.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  useReloadWhenServerRecovers();
  return (
    <html lang="ru">
      <body>
        <title>Ошибка · Error</title>
        <div className="mx-auto max-w-[1500px] px-4 py-16">
          <h1 className="display text-5xl">Что-то пошло не так</h1>
          <p className="mt-2 text-ink-2">Something went wrong</p>
          <div className="mt-6 flex gap-2">
            <button type="button" onClick={() => retry()} className="skew bg-accent px-4 py-1.5 text-accent-ink">
              <span className="display">Повторить · Retry</span>
            </button>
            <Link href="/" className="skew bg-surface-2 px-4 py-1.5 text-ink">
              <span className="display">На главную · Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
