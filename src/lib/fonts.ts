import { Roboto_Condensed, Sofia_Sans_Extra_Condensed } from "next/font/google";

// Open-license fonts (OFL). They are downloaded at build time and served from our own domain.
export const bodyFont = Roboto_Condensed({
  subsets: ["latin", "cyrillic"],
  variable: "--nf-body",
  display: "swap",
});

export const displayFont = Sofia_Sans_Extra_Condensed({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--nf-display",
  display: "swap",
});
