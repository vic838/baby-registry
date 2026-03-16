"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "nl" | "ca" | "en" | "es";
type StatusFilter = "all" | "available" | "offered";
type SortOption = "manual" | "price_asc" | "price_desc";

type Item = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  is_active: boolean;
  category: string | null;
  sort_order: number | null;
  is_contribution_item: boolean;
  lang: Lang;
};

type TotalsRow = {
  item_id: string;
  paid_cents: number;
  reported_cents: number;
};

const categoryLabels: Record<Lang, Record<string, string>> = {
  nl: {
    all: "Alle",
    sleeping: "Slapen",
    feeding: "Voeding",
    care: "Verzorging",
    travel: "Onderweg",
    toys: "Speelgoed",
    clothes: "Kleding",
    room: "Babykamer",
    essentials: "Must-haves",
    other: "Overig",
  },
  ca: {
    all: "Tots",
    sleeping: "Dormir",
    feeding: "Alimentació",
    care: "Cura",
    travel: "Passeig",
    toys: "Joguines",
    clothes: "Roba",
    room: "Habitació",
    essentials: "Imprescindibles",
    other: "Altres",
  },
  en: {
    all: "All",
    sleeping: "Sleeping",
    feeding: "Feeding",
    care: "Care",
    travel: "Travel",
    toys: "Toys",
    clothes: "Clothes",
    room: "Nursery",
    essentials: "Essentials",
    other: "Other",
  },
  es: {
    all: "Todos",
    sleeping: "Dormir",
    feeding: "Alimentación",
    care: "Cuidado",
    travel: "Paseo",
    toys: "Juguetes",
    clothes: "Ropa",
    room: "Habitación",
    essentials: "Imprescindibles",
    other: "Otros",
  },
};

const uiText: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    empty: string;
    loading: string;
    total: string;
    target: string;
    confirmed: string;
    reported: string;
    alreadyOffered: string;
    full: string;
    available: string;
    noTarget: string;
    ofGoal: string;
    darkConfirmed: string;
    filters: string;
    status: string;
    sort: string;
    statusAll: string;
    statusAvailable: string;
    statusOffered: string;
    sortManual: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    offer: string;
    contribute: string;
  }
> = {
  nl: {
    title: "Geboortelijst",
    subtitle: "Kies een cadeau of draag bij aan een item.",
    empty: "Er staan momenteel geen open items op de geboortelijst.",
    loading: "Laden…",
    total: "Totaal",
    target: "Doel",
    confirmed: "bevestigd",
    reported: "gemeld",
    alreadyOffered: "Al aangeboden",
    full: "Volzet",
    available: "Beschikbaar",
    noTarget: "Geen doelbedrag ingesteld",
    ofGoal: "van doel",
    darkConfirmed: "donker = bevestigd",
    filters: "Filters",
    status: "Status",
    sort: "Sortering",
    statusAll: "Alles",
    statusAvailable: "Beschikbaar",
    statusOffered: "Al aangeboden",
    sortManual: "Standaard",
    sortPriceAsc: "Prijs laag → hoog",
    sortPriceDesc: "Prijs hoog → laag",
    offer: "Aanbieden",
    contribute: "Bijdragen",
  },
  ca: {
    title: "Llista de naixement",
    subtitle: "Tria un regal o contribueix a un article.",
    empty: "Actualment no hi ha articles oberts a la llista de naixement.",
    loading: "Carregant…",
    total: "Total",
    target: "Objectiu",
    confirmed: "confirmat",
    reported: "anunciat",
    alreadyOffered: "Ja ofert",
    full: "Complet",
    available: "Disponible",
    noTarget: "No hi ha import objectiu",
    ofGoal: "de l’objectiu",
    darkConfirmed: "fosc = confirmat",
    filters: "Filtres",
    status: "Estat",
    sort: "Ordenació",
    statusAll: "Tots",
    statusAvailable: "Disponible",
    statusOffered: "Ja ofert",
    sortManual: "Per defecte",
    sortPriceAsc: "Preu baix → alt",
    sortPriceDesc: "Preu alt → baix",
    offer: "Oferir",
    contribute: "Contribuir",
  },
  en: {
    title: "Baby Registry",
    subtitle: "Choose a gift or contribute to an item.",
    empty: "There are currently no open items on the baby registry.",
    loading: "Loading…",
    total: "Total",
    target: "Target",
    confirmed: "confirmed",
    reported: "reported",
    alreadyOffered: "Already offered",
    full: "Fully funded",
    available: "Available",
    noTarget: "No target amount set",
    ofGoal: "of goal",
    darkConfirmed: "dark = confirmed",
    filters: "Filters",
    status: "Status",
    sort: "Sort",
    statusAll: "All",
    statusAvailable: "Available",
    statusOffered: "Already offered",
    sortManual: "Default",
    sortPriceAsc: "Price low → high",
    sortPriceDesc: "Price high → low",
    offer: "Offer",
    contribute: "Contribute",
  },
  es: {
    title: "Lista de nacimiento",
    subtitle: "Elige un regalo o contribuye a un artículo.",
    empty: "Actualmente no hay artículos abiertos en la lista de nacimiento.",
    loading: "Cargando…",
    total: "Total",
    target: "Objetivo",
    confirmed: "confirmado",
    reported: "anunciado",
    alreadyOffered: "Ya ofrecido",
    full: "Completo",
    available: "Disponible",
    noTarget: "No hay importe objetivo",
    ofGoal: "del objetivo",
    darkConfirmed: "oscuro = confirmado",
    filters: "Filtros",
    status: "Estado",
    sort: "Ordenar",
    statusAll: "Todos",
    statusAvailable: "Disponible",
    statusOffered: "Ya ofrecido",
    sortManual: "Por defecto",
    sortPriceAsc: "Precio bajo → alto",
    sortPriceDesc: "Precio alto → bajo",
    offer: "Ofrecer",
    contribute: "Contribuir",
  },
};

const categoryOrder = [
  "essentials",
  "sleeping",
  "feeding",
  "care",
  "travel",
  "room",
  "clothes",
  "toys",
  "other",
];

function euro(cents: number, lang: Lang) {
  const locale =
    lang === "nl"
      ? "nl-BE"
      : lang === "ca"
      ? "ca-ES"
      : lang === "es"
      ? "es-ES"
      : "en-GB";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeCategory(category: string | null | undefined) {
  const value = (category ?? "").trim().toLowerCase();

  const aliases: Record<string, string> = {
    sleep: "sleeping",
    sleeping: "sleeping",
    feeding: "feeding",
    food: "feeding",
    care: "care",
    hygiene: "care",
    care_hygiene: "care",
    oral_care_teething: "care",
    verzorging: "care",
    travel: "travel",
    onderweg: "travel",
    outdoor_travel: "travel",
    toys: "toys",
    speelgoed: "toys",
    play_development: "toys",
    play: "toys",
    clothes: "clothes",
    clothing: "clothes",
    kleding: "clothes",
    textiles: "clothes",
    room: "room",
    nursery: "room",
    furniture: "room",
    babykamer: "room",
    essentials: "essentials",
    musthaves: "essentials",
    must_haves: "essentials",
    other: "other",
    overig: "other",
  };

  return aliases[value] ?? (value || "other");
}

function getCategoryLabel(lang: Lang, category: string | null | undefined) {
  const normalized = normalizeCategory(category);
  return categoryLabels[lang][normalized] ?? categoryLabels[lang].other;
}

export default function RegistryPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const routeLang = params.lang ?? "nl";
  const lang: Lang = ["nl", "ca", "en", "es"].includes(routeLang)
    ? (routeLang as Lang)
    : "nl";
  const t = uiText[lang];

  const [items, setItems] = useState<Item[]>([]);
  const [totals, setTotals] = useState<Record<string, TotalsRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("manual");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        if (!isMounted) return;

        setLoading(true);
        setError(null);

        const [{ data: itemsData, error: e1 }, { data: totalsData, error: e2 }] =
          await Promise.all([
            supabase
              .from("items_with_translations")
              .select(
                "id,slug,title,description,image_url,already_owned,target_cents,is_active,category,sort_order,is_contribution_item,lang"
              )
              .eq("lang", lang)
              .eq("is_active", true)
              .order("sort_order", { ascending: true }),
            supabase.from("item_totals").select("item_id,paid_cents,reported_cents"),
          ]);

        if (e1) throw e1;
        if (e2) throw new Error(`Could not load totals: ${e2.message}`);

        const list = ((itemsData ?? []) as Item[]).filter(
          (row) => row.slug && row.title
        );

        const map: Record<string, TotalsRow> = {};
        ((totalsData ?? []) as TotalsRow[]).forEach((row) => {
          map[row.item_id] = {
            item_id: row.item_id,
            paid_cents: Number(row.paid_cents ?? 0),
            reported_cents: Number(row.reported_cents ?? 0),
          };
        });

        if (!isMounted) return;

        setItems(list);
        setTotals(map);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  const cards = useMemo(() => {
    return items.map((it) => {
      const totalsRow = totals[it.id];

      const paid = totalsRow?.paid_cents ?? 0;
      const reported = totalsRow?.reported_cents ?? 0;
      const target = it.target_cents ?? 0;
      const total = paid + reported;

      const totalProgress = target > 0 ? clamp01(total / target) : 0;
      const paidProgress = target > 0 ? clamp01(paid / target) : 0;
      const pct = Math.round(totalProgress * 100);
      const reached = it.is_contribution_item && target > 0 && total >= target;
      const unavailable = it.already_owned || reached;
      const categoryKey = normalizeCategory(it.category);
      const categoryLabel = getCategoryLabel(lang, it.category);
      const displayPrice = it.target_cents ?? 0;

      return {
        it,
        paid,
        reported,
        total,
        target,
        totalProgress,
        paidProgress,
        pct,
        reached,
        unavailable,
        categoryKey,
        categoryLabel,
        displayPrice,
      };
    });
  }, [items, totals, lang]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();

    for (const card of cards) {
      set.add(card.categoryKey);
    }

    return categoryOrder.filter((key) => set.has(key));
  }, [cards]);

  const visibleCards = useMemo(() => {
    let list = [...cards];

    if (selectedCategory !== "all") {
      list = list.filter((card) => card.categoryKey === selectedCategory);
    }

    if (statusFilter === "available") {
      list = list.filter((card) => !card.unavailable);
    } else if (statusFilter === "offered") {
      list = list.filter((card) => card.unavailable);
    }

    if (sortOption === "price_asc") {
      list.sort((a, b) => a.displayPrice - b.displayPrice);
    } else if (sortOption === "price_desc") {
      list.sort((a, b) => b.displayPrice - a.displayPrice);
    } else {
      list.sort(
        (a, b) => Number(a.it.sort_order ?? 0) - Number(b.it.sort_order ?? 0)
      );
    }

    return list;
  }, [cards, selectedCategory, statusFilter, sortOption]);

  useEffect(() => {
    if (selectedCategory === "all") return;

    const stillExists = availableCategories.includes(selectedCategory);
    if (!stillExists) {
      setSelectedCategory("all");
    }
  }, [availableCategories, selectedCategory]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-6 py-8 text-[#5e6a50]">
        {t.loading}
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-6 py-8 text-red-600">
        Error: {error}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl text-[#5e6a50]">{t.title}</h1>
        <div className="mt-2 text-sm text-[#7c8570]">{t.subtitle}</div>

        {cards.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#d8ddd1] bg-white p-6 text-sm text-[#6c7561] shadow-sm">
            {t.empty}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <div>
                <div className="mb-2 text-sm text-[#7c8570]">{t.filters}</div>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={[
                      "whitespace-nowrap rounded-full border px-4 py-2 text-xs transition",
                      selectedCategory === "all"
                        ? "border-[#5e6a50] bg-[#5e6a50] text-white"
                        : "border-[#cfd5c7] bg-white text-[#5e6a50] hover:bg-[#f3f1eb]",
                    ].join(" ")}
                  >
                    {categoryLabels[lang].all}
                  </button>

                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={[
                        "whitespace-nowrap rounded-full border px-4 py-2 text-xs transition",
                        selectedCategory === category
                          ? "border-[#5e6a50] bg-[#5e6a50] text-white"
                          : "border-[#cfd5c7] bg-white text-[#5e6a50] hover:bg-[#f3f1eb]",
                      ].join(" ")}
                    >
                      {categoryLabels[lang][category] ?? categoryLabels[lang].other}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#7c8570]">
                  {t.status}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-2.5 text-sm text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                >
                  <option value="all">{t.statusAll}</option>
                  <option value="available">{t.statusAvailable}</option>
                  <option value="offered">{t.statusOffered}</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#7c8570]">
                  {t.sort}
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-2.5 text-sm text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                >
                  <option value="manual">{t.sortManual}</option>
                  <option value="price_asc">{t.sortPriceAsc}</option>
                  <option value="price_desc">{t.sortPriceDesc}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCards.map(
                ({
                  it,
                  paid,
                  reported,
                  total,
                  target,
                  totalProgress,
                  paidProgress,
                  pct,
                  reached,
                  unavailable,
                  categoryLabel,
                }) => {
                  const statusText = it.already_owned
                    ? t.alreadyOffered
                    : reached
                    ? t.full
                    : t.available;

                  const statusClass = it.already_owned
                    ? "bg-[#ecefe7] text-[#5e6a50]"
                    : reached
                    ? "bg-[#dfe7d7] text-[#4f5a44]"
                    : "bg-[#f4efe3] text-[#8a7753]";

                  const ctaText = it.is_contribution_item ? t.contribute : t.offer;

                  return (
                    <div
                      key={it.id}
                      className={[
                        "rounded-2xl border border-[#d8ddd1] bg-white p-4 shadow-sm transition",
                        unavailable ? "opacity-80" : "hover:-translate-y-0.5 hover:shadow-md",
                      ].join(" ")}
                    >
                      {it.image_url ? (
                        <div className="rounded-xl bg-[#f8f6f2] p-3">
                          <img
                            src={it.image_url}
                            alt={it.title}
                            className="h-44 w-full rounded-lg object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-44 w-full items-center justify-center rounded-xl bg-[#f3f1eb] text-sm text-[#8d9484]">
                          No image
                        </div>
                      )}

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2">
                            <span className="inline-flex rounded-full bg-[#ecefe7] px-3 py-1 text-xs text-[#5e6a50]">
                              {categoryLabel}
                            </span>
                          </div>

                          <div className="text-base text-[#5e6a50]">{it.title}</div>

                          {it.description ? (
                            <div className="mt-1 line-clamp-2 text-sm text-[#7c8570]">
                              {it.description}
                            </div>
                          ) : null}
                        </div>

                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>

                      {it.is_contribution_item ? (
                        <div className="mt-4">
                          <div className="flex items-start justify-between gap-4 text-sm">
                            <div className="text-[#7c8570]">
                              <div>
                                {t.total}:{" "}
                                <span className="text-[#5e6a50]">{euro(total, lang)}</span>
                              </div>

                              <div className="mt-1 text-xs text-[#9ba292]">
                                {euro(paid, lang)} {t.confirmed}
                                {reported > 0
                                  ? ` · ${euro(reported, lang)} ${t.reported}`
                                  : ""}
                              </div>
                            </div>

                            <div className="text-right text-[#7c8570]">
                              <div>
                                {t.target}:{" "}
                                <span className="text-[#5e6a50]">
                                  {target > 0 ? euro(target, lang) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e8ebe3]">
                            <div
                              className="h-2 bg-[#cfd5c7]"
                              style={{ width: `${Math.round(totalProgress * 100)}%` }}
                            />
                            <div
                              className="-mt-2 h-2 bg-[#5e6a50]"
                              style={{ width: `${Math.round(paidProgress * 100)}%` }}
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs text-[#9ba292]">
                            <span>
                              {target > 0 ? `${pct}% ${t.ofGoal}` : t.noTarget}
                            </span>
                            <span>{t.darkConfirmed}</span>
                          </div>
                        </div>
                      ) : it.target_cents ? (
                        <div className="mt-4 text-sm text-[#7c8570]">
                          {t.target}:{" "}
                          <span className="text-[#5e6a50]">{euro(it.target_cents, lang)}</span>
                        </div>
                      ) : null}

                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => router.push(`/${lang}/item/${it.slug}`)}
                          className={[
                            "w-full rounded-2xl px-4 py-3 text-sm transition",
                            unavailable
                              ? "bg-[#f3f1eb] text-[#5e6a50] hover:bg-[#ece8df]"
                              : "bg-[#5e6a50] text-white hover:opacity-90",
                          ].join(" ")}
                        >
                          {unavailable ? t.statusOffered : ctaText}
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}