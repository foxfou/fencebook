import { BRAND, GAME } from "./site";
import type { Locale } from "./types";

export const locales: Locale[] = ["ru", "en"];
export const defaultLocale: Locale = "ru";

export function isLocale(v: string): v is Locale {
  return (locales as string[]).includes(v);
}

const ru = {
  brand: BRAND,
  brandSub: GAME,
  nav: { items: "Предметы" },
  catalog: {
    title: "Предметы",
    lead: `Каталог всех предметов игры ${GAME} с базовыми ценами, размером в слотах и ценой за слот.`,
    search: "Поиск по названию…",
    reset: "Сбросить",
    filters: "Фильтры",
    found: "Найдено",
    of: "из",
    sort: "Сортировка",
    sortName: "По названию",
    sortSellDesc: "Цена: дорогие сверху",
    sortSellAsc: "Цена: дешёвые сверху",
    sortPerSlot: "Цена за слот",
    category: "Категория",
    rarity: "Редкость",
    price: "Цена продажи",
    from: "от",
    to: "до",
    empty: "Ничего не найдено. Попробуйте сбросить фильтры.",
  },
  item: {
    back: "Все предметы",
    category: "Категория",
    type: "Тип",
    size: "Размер",
    slots: "слот.",
    sell: "Цена продажи (база)",
    perSlot: "Цена за слот",
    buy: "Цена покупки",
    research: "Исследование в поставках",
    purchaseFrom: "Где купить",
    lootSpot: "Где встречается",
    spots: "точек",
    stack: "Стопка",
    otherNames: "Названия на других языках",
    incomplete: "Данные по этому предмету неполные. Мы их ещё собираем.",
    noData: "нет данных",
    baseNote: "Базовая цена скупщика, без бонуса известности.",
  },
  categories: {
    valuables: "Ценности",
    base: "База и постройки",
    "keys-tools": "Ключи и инструменты",
    weapons: "Оружие",
    "car-upgrades": "Автоапгрейды",
    "armor-bags": "Броня и сумки",
    drugs: "Лаборатория",
    "ammo-grenades": "Патроны и гранаты",
    vehicles: "Транспорт",
    medicine: "Медицина",
  } as Record<string, string>,
  rarities: {
    "0": "Неизвестно",
    "1": "Обычный",
    "2": "Необычный",
    "4": "Эпический",
    "5": "Легендарный",
    "6": "Экзотический",
  } as Record<string, string>,
  footer: {
    disclaimer:
      `${BRAND} — неофициальный справочник по игре ${GAME}. Не связан с Kefir; права на игру и её материалы принадлежат правообладателю.`,
    data: "Данные: билд игры",
  },
  notFound: "Страница не найдена",
};

export type Dict = typeof ru;

const en: Dict = {
  brand: BRAND,
  brandSub: GAME,
  nav: { items: "Items" },
  catalog: {
    title: "Items",
    lead: `Every item in ${GAME} with base prices, size in slots and value per slot.`,
    search: "Search by name…",
    reset: "Reset",
    filters: "Filters",
    found: "Found",
    of: "of",
    sort: "Sort",
    sortName: "By name",
    sortSellDesc: "Price: high to low",
    sortSellAsc: "Price: low to high",
    sortPerSlot: "Value per slot",
    category: "Category",
    rarity: "Rarity",
    price: "Sell price",
    from: "from",
    to: "to",
    empty: "Nothing found. Try resetting the filters.",
  },
  item: {
    back: "All items",
    category: "Category",
    type: "Type",
    size: "Size",
    slots: "slots",
    sell: "Sell price (base)",
    perSlot: "Value per slot",
    buy: "Buy price",
    research: "Shipments research",
    purchaseFrom: "Where to buy",
    lootSpot: "Where it turns up",
    spots: "spots",
    stack: "Stack",
    otherNames: "Names in other languages",
    incomplete: "Data for this item is incomplete. We are still collecting it.",
    noData: "no data",
    baseNote: "Base fence price, before the notoriety bonus.",
  },
  categories: {
    valuables: "Valuables",
    base: "Base & buildings",
    "keys-tools": "Keys & tools",
    weapons: "Weapons",
    "car-upgrades": "Car upgrades",
    "armor-bags": "Armor & bags",
    drugs: "Lab",
    "ammo-grenades": "Ammo & grenades",
    vehicles: "Vehicles",
    medicine: "Medicine",
  },
  rarities: {
    "0": "Unknown",
    "1": "Common",
    "2": "Uncommon",
    "4": "Epic",
    "5": "Legendary",
    "6": "Exotic",
  },
  footer: {
    disclaimer:
      `${BRAND} is an unofficial reference for the game ${GAME}. Not affiliated with Kefir; rights to the game and its materials belong to the rights holder.`,
    data: "Data: game build",
  },
  notFound: "Page not found",
};

const dicts: Record<Locale, Dict> = { ru, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}
