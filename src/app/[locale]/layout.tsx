import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { bodyFont, displayFont } from "@/lib/fonts";
import { getDict, isLocale, locales } from "@/lib/i18n";
import { BRAND, siteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = isLocale(locale) ? getDict(locale) : getDict("ru");
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.seo.siteTitle, template: `%s | ${BRAND}` },
    description: t.seo.siteDescription,
    applicationName: BRAND,
    openGraph: { type: "website", siteName: BRAND },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    // Site ownership codes for Google Search Console and Yandex Webmaster, set at build time (see README).
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    },
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
