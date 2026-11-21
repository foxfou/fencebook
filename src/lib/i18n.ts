import { BRAND, GAME } from "./site";
import type { Locale } from "./types";

export const locales: Locale[] = ["ru", "en"];
export const defaultLocale: Locale = "ru";

export function isLocale(v: string): v is Locale {
  return (locales as string[]).includes(v);
}

/** Russian plural: 1 предмет, 2 предмета, 5 предметов. */
function ruPlural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

/** English article for a word: "an epic item", "a common item". */
function an(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
}

/** Data for the generated overview of an item page. Money values come already formatted. */
export interface SummaryInput {
  name: string;
  /** Rarity label, or null when it is unknown. */
  rarity: string | null;
  category: string | null;
  price: string | null;
  perSlot: string | null;
  size: string | null;
  slotRank: number | null;
  /** Items in the category. */
  n: number;
  shipment: boolean;
  /** Research of the shipment, null when it is free. */
  research: string | null;
  /** Whole path with the earlier shipments, null when it is the same as the research. */
  pathTotal: string | null;
}

const ru = {
  brand: BRAND,
  brandTag: `справочник ${GAME}`,
  nav: { items: "Предметы", shipments: "Поставки" },
  shipments: {
    title: `Поставки Ленни в ${GAME}`,
    lead: "Дерево разблокировок Ленни: что открывает каждая поставка, сколько стоит исследование и какой путь нужно пройти до цели.",
    canvasLabel: "Дерево поставок Ленни",
    zoomIn: "Приблизить",
    zoomOut: "Отдалить",
    fit: "Показать всё дерево",
    fullscreen: "Во весь экран",
    exitFullscreen: "Свернуть",
    categories: {
      documents: "Документы",
      vehicles: "Транспорт",
      construction: "Строительство",
      furnishings: "Мебель",
      weapons: "Оружие",
      production: "Производство",
      gear: "Снаряжение",
      gadgets: "Гаджеты",
    } as Record<string, string>,
    settlementLevel: "поселение {n} уровня",
    research: "Исследование",
    free: "бесплатно",
    buy: "Покупка на чёрном рынке",
    jail: "Нужен срок в тюрьме",
    requires: "Сначала нужно",
    opens: "Открывает",
    itemPage: "Страница предмета",
    close: "Закрыть",
    search: "Найти поставку…",
    clearSearch: "Очистить поиск",
    filters: "Фильтры",
    categoryFilter: "Категория",
    levelFilter: "Доступно в поселении",
    resetFilters: "Сбросить",
    noMatches: "Ничего не найдено",
    plan: "План",
    planEmpty: "Выберите поставку на дереве и нажмите «В план». Всё, что нужно открыть раньше, посчитается само.",
    addToPlan: "В план",
    removeFromPlan: "Убрать из плана",
    neededForPlan: "Нужна для плана",
    total: "Итого",
    settlement: "Поселение",
    ownedLevel: "Моё поселение",
    ownedNone: "Нет",
    jailShort: "Срок в тюрьме",
    level: "{n} уровень",
    levelShort: "{n} ур.",
    count: "Поставок",
    openOrder: "Порядок открытия",
    resetPlan: "Очистить план",
    openPlan: "Открыть план в новой вкладке",
    none: "—",
    rentLabel: "аренда",
    rentTag: "аренда {price}",
  },
  home: {
    title: `Справочник по ${GAME}`,
    lead: `${BRAND} — неофициальный справочник по игре ${GAME}. Здесь собраны цены у скупщика, размеры предметов в слотах и дерево поставок Ленни: всё, что помогает решить, что выносить из забега и во что вкладывать деньги.`,
    sections: "Разделы",
    items: {
      title: "Предметы",
      text: (n: number) => `${n} предметов игры: цена у скупщика, размер в слотах и цена за слот. Поиск, фильтры по категории, редкости и цене.`,
      cta: "Открыть каталог",
    },
    shipments: {
      title: "Поставки",
      text: (n: number) => `Дерево из ${n} поставок Ленни: что открывает каждая, сколько стоит исследование и путь до нужной поставки.`,
      cta: "Открыть дерево",
    },
    dataNote: (build: number) => `Данные взяты из файлов игры, билд ${build}. Мы обновляем их после патчей.`,
  },
  catalog: {
    title: `Предметы ${GAME}`,
    lead: `Каталог всех предметов игры ${GAME} с базовыми ценами, размером в слотах и ценой за слот.`,
    search: "Поиск по названию…",
    clearSearch: "Очистить поиск",
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
    categoriesNav: "Категории",
    allCategories: "Все",
  },
  // A page per category.
  category: {
    title: (cat: string) => `${cat} в ${GAME}`,
    count: (cat: string, n: number) => `В категории «${cat}» ${n} ${ruPlural(n, "предмет", "предмета", "предметов")}.`,
    mostExpensive: "Самый дорогой у скупщика —",
    bestPerSlot: "самый выгодный по цене за слот —",
    perSlot: "за слот",
  },
  // Questions and answers under the catalog.
  faq: {
    title: "Вопросы и ответы",
    items: (build: number) => [
      {
        q: "Что такое цена у скупщика?",
        a: "Сколько скупщик платит за предмет. На сайте указана базовая цена при известности 1. С ростом известности скупщик платит больше: при известности 5 на 50 % больше базовой цены.",
      },
      {
        q: "Что такое цена за слот?",
        a: "Цена у скупщика, делённая на число слотов, которые предмет занимает в сумке. Когда место заканчивается, выгоднее нести то, у чего цена за слот выше.",
      },
      {
        q: "Где купить нужный предмет?",
        a: "Многое продаётся на чёрном рынке после того, как вы откроете поставку у Ленни. Часть предметов можно купить прямо в рейде в городских магазинах, пока вы гражданский и не надели маску, но втрое дороже.",
      },
      {
        q: "Откуда эти данные?",
        a: `Названия, описания и иконки взяты из файлов игры, билд ${build}. Цены, размеры и места появления взяты из справочных данных, мы обновляем их после патчей.`,
      },
    ],
  },
  item: {
    back: "Все предметы",
    category: "Категория",
    type: "Тип",
    size: "Размер",
    slots: "слот.",
    sell: "Базовая цена продажи",
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
    gameId: "ID в игре",
    home: "Главная",
    details: "Подробности",
    similar: "Похожие предметы",
    allInCategory: "Все предметы категории",
    shipmentTitle: "В поставках Ленни",
    shipmentBranch: "Раздел дерева",
    shipmentLead: "Предмет открывается в дереве поставок. Вот что нужно, чтобы получить к нему доступ.",
    pathTotal: "Весь путь до неё",
    pathSteps: (n: number) =>
      `${n} ${n % 10 === 1 && n % 100 !== 11 ? "поставка" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "поставки" : "поставок"} с учётом предыдущих`,
    openInTree: "Показать в дереве поставок",
    overview: "Обзор",
    summary: (p: SummaryInput) =>
      [
        `${p.name} — ${p.rarity ? `${p.rarity.toLowerCase()} предмет` : "предмет"}${p.category ? ` из категории «${p.category}»` : ""} в ${GAME}.`,
        p.price
          ? `Цена у скупщика — ${p.price}${p.perSlot && p.size ? `, или ${p.perSlot} за слот при размере ${p.size}` : ""}.`
          : null,
        p.slotRank && p.n > 1 ? `По цене за слот это ${p.slotRank}-е место из ${p.n} в категории.` : null,
        p.shipment
          ? p.research
            ? `Открывается в поставках Ленни: исследование стоит ${p.research}${p.pathTotal ? `, весь путь с предыдущими поставками — ${p.pathTotal}` : ""}.`
            : `Открывается в поставках Ленни, исследование бесплатное${p.pathTotal ? `, весь путь с предыдущими поставками — ${p.pathTotal}` : ""}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    slotsTotal: (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "слот" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "слота" : "слотов"}`,
  },
  // "Where to buy": sources parsed from the dataset (see purchase.ts). Shop names and "Civilian" follow the game's own texts.
  purchase: {
    blackMarket: "Чёрный рынок",
    afterShipment: "после открытия поставки",
    noConditions: "без условий",
    settlement: "поселение {n} уровня",
    inRaid: "в рейде",
    priceFactor: "цена ×{n}",
    civiliansOnly: "только гражданскому, пока не надета маска",
    shops: {
      electronics: "Магазин электроники",
      arms: "Оружейный магазин",
      armor: "Магазин экипировки",
      carParts: "Магазин автозапчастей",
      comicsLiquor: "Магазин комиксов и алкоголя",
      jewelry: "Ювелирный магазин",
      medical: "Аптека",
      liquor: "Алкогольный магазин",
    } as Record<string, string>,
  },
  // Loot spot types and item types come from the dataset in English.
  lootSpots: {
    "Weapons & ammo": "Оружие и патроны",
    "Art & antiques": "Искусство и антиквариат",
    Gear: "Снаряжение",
    Electronics: "Электроника",
    "Jewellery displays": "Ювелирные витрины",
    "Car parts": "Автозапчасти",
    Medicine: "Медикаменты",
    "Alcohol & cigars": "Алкоголь и сигары",
    "Drug stashes": "Тайники с наркотиками",
    "Cash registers": "Кассы",
  } as Record<string, string>,
  types: {
    Electronics: "Электроника",
    Medicine: "Медицина",
    "Alcohol & Tobacco": "Алкоголь и табак",
    Collectible: "Коллекционный предмет",
    SMG: "Пистолет-пулемёт",
    Armor: "Броня",
    "Security & Raids": "Охрана и налёты",
    Bag: "Сумка",
    Tool: "Инструмент",
    Car: "Автомобиль",
    Gear: "Снаряжение",
    Drugs: "Наркотики",
    "Car Upgrade": "Улучшение автомобиля",
    "Car Parts": "Автозапчасти",
    Structure: "Постройка",
    "Workbench Upgrade": "Улучшение верстака",
    "Cargo Sheet": "Грузовая ведомость",
    Cash: "Наличные",
    Furniture: "Мебель",
    Goods: "Товары",
    Pistol: "Пистолет",
    "Assault Rifle": "Штурмовая винтовка",
    Jewellery: "Ювелирные изделия",
    Grenade: "Граната",
    Ammo: "Патроны",
    Shotgun: "Дробовик",
    "Medical Goods": "Медтовары",
    Evidence: "Улики",
    Helicopter: "Вертолёт",
    Key: "Ключ",
    "Casino Chip": "Фишки казино",
  } as Record<string, string>,
  // Texts for search engines and link previews. Server only, never sent to the client.
  seo: {
    siteTitle: `${BRAND} — справочник по ${GAME}`,
    siteDescription: `Цены у скупщика, размеры в слотах и выгода за слот для каждого предмета ${GAME}, а ещё дерево поставок Ленни со стоимостью пути до цели.`,
    catalogTitle: `Предметы ${GAME}: цены, размеры и цена за слот`,
    catalogDescription: (n: number) =>
      `Все ${n} предметов ${GAME} в одном месте: цена у скупщика, размер в слотах и выгода за слот. Узнайте, что выносить, а что бросать.`,
    catalogShare: `Цены у скупщика, размеры в слотах и выгода за слот. Узнайте, что выносить из забега.`,
    shipmentsTitle: `Поставки Ленни в ${GAME}: дерево разблокировок и стоимость`,
    shipmentsDescription: (n: number, total: string) =>
      `Дерево из ${n} поставок Ленни в ${GAME}: что открывает каждая, сколько стоит исследование и какой путь пройти до цели. Всё дерево стоит ${total}.`,
    shipmentsShare: `Дерево разблокировок Ленни: что открывает каждая поставка и сколько стоит путь до цели.`,
    // The price right in the title: the search result answers the question at once.
    itemTitle: (name: string, price: string | null, size: string | null) =>
      price ? `${name}: цена ${price}${size ? `, размер ${size}` : ""} — ${GAME}` : `${name} — цена и размер в ${GAME}`,
    categoryTitle: (cat: string) => `${cat} в ${GAME}: цены у скупщика и цена за слот`,
    categoryDescription: (cat: string, n: number, min: string | null, max: string | null) =>
      `${cat} в ${GAME}: ${n} ${ruPlural(n, "предмет", "предмета", "предметов")}${min && max ? ` с ценой у скупщика от ${min} до ${max}` : ""}. Размер в слотах, цена за слот и где купить.`,
    itemLead: (name: string, price: string | null, size: string | null, rarity: string | null) =>
      [
        `${name} в ${GAME}`,
        [price && `цена у скупщика ${price}`, size && `размер ${size}`, rarity && rarity.toLowerCase()]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join(": ") + ".",
  },
  // Captions on the link preview images
  og: {
    catalogHeadline: ["Все предметы", GAME],
    catalogPoints: ["Цены у скупщика", "Размеры в слотах", "Цена за слот"],
    shipmentsHeadline: ["Поставки Ленни", GAME],
    shipmentsPoints: ["Дерево разблокировок", "Стоимость пути до цели", "Порядок исследования"],
    fencePrice: "Цена у скупщика",
    size: "Размер",
    perSlot: "За слот",
    noPrice: "нет данных",
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
    disclaimer: `${BRAND} — неофициальный справочник по игре ${GAME}. Не связан с Kefir; права на игру и её материалы принадлежат правообладателю.`,
    data: "Данные: билд игры",
  },
  notFound: "Страница не найдена",
};

export type Dict = typeof ru;

const en: Dict = {
  brand: BRAND,
  brandTag: `${GAME} database`,
  nav: { items: "Items", shipments: "Shipments" },
  shipments: {
    title: `Larry's shipments in ${GAME}`,
    lead: "Larry's unlock tree: what each shipment opens, what the research costs and the path you have to take to reach a goal.",
    canvasLabel: "Larry's shipments tree",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Show the whole tree",
    fullscreen: "Full screen",
    exitFullscreen: "Exit full screen",
    categories: {
      documents: "Documents",
      vehicles: "Vehicles",
      construction: "Construction",
      furnishings: "Furnishings",
      weapons: "Weapons",
      production: "Production",
      gear: "Gear",
      gadgets: "Gadgets",
    },
    settlementLevel: "settlement level {n}",
    research: "Research",
    free: "free",
    buy: "Black Market price",
    jail: "Jail term needed",
    requires: "Unlock first",
    opens: "Opens",
    itemPage: "Item page",
    close: "Close",
    search: "Find a shipment…",
    clearSearch: "Clear search",
    filters: "Filters",
    categoryFilter: "Category",
    levelFilter: "Available at settlement",
    resetFilters: "Reset",
    noMatches: "Nothing found",
    plan: "Plan",
    planEmpty: "Pick a shipment on the tree and press “Add to plan”. Everything you have to unlock first is counted for you.",
    addToPlan: "Add to plan",
    removeFromPlan: "Remove from plan",
    neededForPlan: "Needed for your plan",
    total: "Total",
    settlement: "Settlement",
    ownedLevel: "My settlement",
    ownedNone: "None",
    jailShort: "Jail term",
    level: "Level {n}",
    levelShort: "lvl {n}",
    count: "Shipments",
    openOrder: "Unlock order",
    resetPlan: "Clear plan",
    openPlan: "Open the plan in a new tab",
    none: "—",
    rentLabel: "rent",
    rentTag: "rent {price}",
  },
  home: {
    title: `A ${GAME} reference`,
    lead: `${BRAND} is an unofficial reference for the game ${GAME}. It collects fence prices, item sizes in slots and Larry's shipment tree: everything that helps you decide what to carry out of a run and where to put your money.`,
    sections: "Sections",
    items: {
      title: "Items",
      text: (n: number) => `${n} items from the game: fence price, size in slots and value per slot. Search and filters by category, rarity and price.`,
      cta: "Open the catalog",
    },
    shipments: {
      title: "Shipments",
      text: (n: number) => `A tree of ${n} of Larry's shipments: what each one opens, what the research costs and the path to the shipment you need.`,
      cta: "Open the tree",
    },
    dataNote: (build: number) => `The data comes from the game files, build ${build}. We update it after patches.`,
  },
  catalog: {
    title: `${GAME} items`,
    lead: `Every item in ${GAME} with base prices, size in slots and value per slot.`,
    search: "Search by name…",
    clearSearch: "Clear search",
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
    categoriesNav: "Categories",
    allCategories: "All",
  },
  category: {
    title: (cat: string) => `${GAME} ${cat}`,
    count: (cat: string, n: number) => `The ${cat} category has ${n} item${n === 1 ? "" : "s"}.`,
    mostExpensive: "The most expensive at the fence is",
    bestPerSlot: "the best value per slot is",
    perSlot: "per slot",
  },
  faq: {
    title: "Questions and answers",
    items: (build: number) => [
      {
        q: "What is the fence price?",
        a: "What the fence pays for an item. The site shows the base price at notoriety 1. The fence pays more as your notoriety grows: at notoriety 5 it is 50% above the base price.",
      },
      {
        q: "What is value per slot?",
        a: "The fence price divided by the number of slots the item takes in your bag. When you run out of room, carry what has the higher value per slot.",
      },
      {
        q: "Where can I buy an item?",
        a: "Many items are sold on the Black Market once you unlock their shipment with Larry. Some can be bought right in the raid in the city's stores while you are a Civilian without a mask, at three times the price.",
      },
      {
        q: "Where does this data come from?",
        a: `Names, descriptions and icons come from the game files, build ${build}. Prices, sizes and loot spots come from reference data that we update after patches.`,
      },
    ],
  },
  item: {
    back: "All items",
    category: "Category",
    type: "Type",
    size: "Size",
    slots: "slots",
    sell: "Base sell price",
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
    gameId: "In-game ID",
    home: "Home",
    details: "Details",
    similar: "Similar items",
    allInCategory: "All items in",
    shipmentTitle: "In Larry's shipments",
    shipmentBranch: "Tree section",
    shipmentLead: "This item is unlocked in the shipment tree. Here is what it takes to get access to it.",
    pathTotal: "Full path to it",
    pathSteps: (n: number) => `${n} shipment${n === 1 ? "" : "s"}, including the earlier ones`,
    openInTree: "Show in the shipment tree",
    overview: "Overview",
    summary: (p: SummaryInput) =>
      [
        `${p.name} is ${p.rarity ? `${an(p.rarity)} ${p.rarity.toLowerCase()} item` : "an item"}${p.category ? ` in the ${p.category} category` : ""} in ${GAME}.`,
        p.price ? `The fence pays ${p.price}${p.perSlot && p.size ? `, or ${p.perSlot} per slot for a ${p.size} item` : ""}.` : null,
        p.slotRank && p.n > 1 ? `By value per slot it ranks ${ordinal(p.slotRank)} of ${p.n} in its category.` : null,
        p.shipment
          ? `It is unlocked through Larry's shipments: ${p.research ? `research costs ${p.research}` : "research is free"}${p.pathTotal ? `, the whole path with earlier shipments costs ${p.pathTotal}` : ""}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    slotsTotal: (n: number) => `${n} ${n === 1 ? "slot" : "slots"}`,
  },
  purchase: {
    blackMarket: "Black Market",
    afterShipment: "after the shipment is unlocked",
    noConditions: "no conditions",
    settlement: "settlement level {n}",
    inRaid: "in the raid",
    priceFactor: "price ×{n}",
    civiliansOnly: "Civilians only, before the mask is on",
    shops: {
      electronics: "Electronics Store",
      arms: "Gun Shop",
      armor: "Equipment Store",
      carParts: "Car Parts Store",
      comicsLiquor: "Comics & Liquor Store",
      jewelry: "Jewelry Store",
      medical: "Pharmacy",
      liquor: "Liquor Store",
    },
  },
  lootSpots: {
    "Weapons & ammo": "Weapons & ammo",
    "Art & antiques": "Art & antiques",
    Gear: "Gear",
    Electronics: "Electronics",
    "Jewellery displays": "Jewelry displays",
    "Car parts": "Car parts",
    Medicine: "Medicine",
    "Alcohol & cigars": "Alcohol & cigars",
    "Drug stashes": "Drug stashes",
    "Cash registers": "Cash registers",
  },
  types: {
    Electronics: "Electronics",
    Medicine: "Medicine",
    "Alcohol & Tobacco": "Alcohol & Tobacco",
    Collectible: "Collectible",
    SMG: "SMG",
    Armor: "Armor",
    "Security & Raids": "Security & Raids",
    Bag: "Bag",
    Tool: "Tool",
    Car: "Car",
    Gear: "Gear",
    Drugs: "Drugs",
    "Car Upgrade": "Car Upgrade",
    "Car Parts": "Car Parts",
    Structure: "Structure",
    "Workbench Upgrade": "Workbench Upgrade",
    "Cargo Sheet": "Cargo Sheet",
    Cash: "Cash",
    Furniture: "Furniture",
    Goods: "Goods",
    Pistol: "Pistol",
    "Assault Rifle": "Assault Rifle",
    Jewellery: "Jewelry",
    Grenade: "Grenade",
    Ammo: "Ammo",
    Shotgun: "Shotgun",
    "Medical Goods": "Medical Goods",
    Evidence: "Evidence",
    Helicopter: "Helicopter",
    Key: "Key",
    "Casino Chip": "Casino Chip",
  },
  seo: {
    siteTitle: `${BRAND} — ${GAME} database`,
    siteDescription: `Fence prices, slot sizes and value per slot for every ${GAME} item, plus Larry's shipment tree with the cost of the path to your goal.`,
    catalogTitle: `${GAME} Items: Prices, Slot Sizes and Value per Slot`,
    catalogDescription: (n: number) =>
      `All ${n} ${GAME} items in one place: fence price, slot size and value per slot. See what to carry out and what to drop.`,
    catalogShare: `Fence prices, slot sizes and value per slot. Know what to carry out of a run.`,
    shipmentsTitle: `Larry's Shipments in ${GAME}: Unlock Tree and Costs`,
    shipmentsDescription: (n: number, total: string) =>
      `All ${n} of Larry's shipments in ${GAME}: what each one opens, what the research costs and the path to your goal. The whole tree costs ${total}.`,
    shipmentsShare: `Larry's unlock tree: what each shipment opens and what the path to your goal costs.`,
    itemTitle: (name: string, price: string | null, size: string | null) =>
      price ? `${name}: ${price} Fence Price${size ? `, ${size}` : ""} — ${GAME}` : `${name}: Price and Size in ${GAME}`,
    categoryTitle: (cat: string) => `${GAME} ${cat}: Fence Prices and Value per Slot`,
    categoryDescription: (cat: string, n: number, min: string | null, max: string | null) =>
      `${n} ${GAME} ${cat.toLowerCase()} item${n === 1 ? "" : "s"}${min && max ? ` with fence prices from ${min} to ${max}` : ""}. Slot sizes, value per slot and where to buy.`,
    itemLead: (name: string, price: string | null, size: string | null, rarity: string | null) =>
      [
        `${name} in ${GAME}`,
        [price && `fence price ${price}`, size && `size ${size}`, rarity && rarity.toLowerCase()]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join(": ") + ".",
  },
  og: {
    catalogHeadline: ["Every item in", GAME],
    catalogPoints: ["Fence prices", "Slot sizes", "Value per slot"],
    shipmentsHeadline: ["Larry's shipments", GAME],
    shipmentsPoints: ["The unlock tree", "Cost of the path to a goal", "Research order"],
    fencePrice: "Fence price",
    size: "Size",
    perSlot: "Per slot",
    noPrice: "no data",
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
    disclaimer: `${BRAND} is an unofficial reference for the game ${GAME}. Not affiliated with Kefir; rights to the game and its materials belong to the rights holder.`,
    data: "Data: game build",
  },
  notFound: "Page not found",
};

const dicts: Record<Locale, Dict> = { ru, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}
