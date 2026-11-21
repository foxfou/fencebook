import Link from "next/link";
import { Fragment } from "react";
import { siteUrl } from "@/lib/site";
import { CatalogLink } from "./CatalogLink";

export interface Crumb {
  name: string;
  /** Path with the language prefix, for example "/ru/items". The last crumb is the current page. */
  href: string;
  /** The catalog link: goes back to the filters the visitor last used (see CatalogLink). */
  catalog?: boolean;
}

/** Breadcrumbs for people and, as BreadcrumbList markup, for search engines. */
export function Breadcrumbs({ crumbs, locale }: { crumbs: Crumb[]; locale: string }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, k) => ({ "@type": "ListItem", position: k + 1, name: c.name, item: `${siteUrl}${c.href}` })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped, so the JSON cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumbs" className="text-sm text-ink-3">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((c, k) => {
            const last = k === crumbs.length - 1;
            return (
              <Fragment key={c.href}>
                {k > 0 && <li aria-hidden="true">/</li>}
                <li aria-current={last ? "page" : undefined} className={last ? "text-ink-2" : undefined}>
                  {last ? (
                    c.name
                  ) : c.catalog ? (
                    <CatalogLink locale={locale} className="hover:text-accent">
                      {c.name}
                    </CatalogLink>
                  ) : (
                    <Link href={c.href} className="hover:text-accent">
                      {c.name}
                    </Link>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
