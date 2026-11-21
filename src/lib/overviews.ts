// Hand-written item overviews: what the item is for, whether it has other uses, and whether to keep it or sell it.
// The texts live in data/overviews/<locale>/*.json as { "<item id>": "<text>" }. Facts and sources are in the project docs (12–17).
// A locale without a text for an item falls back to the overview generated from the data (i18n summary).
import ruBase from "../../data/overviews/ru/base.json";
import ruCombat from "../../data/overviews/ru/combat.json";
import ruKeysVehicles from "../../data/overviews/ru/keys-vehicles.json";
import ruValuables1 from "../../data/overviews/ru/valuables-1.json";
import ruValuables2 from "../../data/overviews/ru/valuables-2.json";
import type { Locale } from "./types";

export const overviews: Partial<Record<Locale, Record<string, string>>> = {
  ru: { ...ruValuables1, ...ruValuables2, ...ruCombat, ...ruKeysVehicles, ...ruBase },
};

/** The hand-written overview of an item, or null when there is none in this language. */
export function itemOverview(id: string, locale: Locale): string | null {
  return overviews[locale]?.[id] || null;
}
