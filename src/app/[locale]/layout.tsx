import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { bodyFont, displayFont } from "@/lib/fonts";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { BRAND, GAME, siteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = isLocale(locale) ? getDict(locale) : getDict("ru");
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${BRAND} · ${GAME}`, template: `%s · ${BRAND}` },
    description: t.catalog.lead,
    applicationName: BRAND,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <html lang={locale} className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header locale={locale} t={t} />
        <main className="flex-1">{children}</main>
        <Footer t={t} />
      </body>
    </html>
  );
}
