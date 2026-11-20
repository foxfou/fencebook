import "../globals.css";
import { bodyFont, displayFont } from "@/lib/fonts";

// Root layout for "/" only. It redirects to the default language at once.
export default function RootRedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
