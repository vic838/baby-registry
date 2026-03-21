"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RegistryFaqSection from "../../components/RegistryFaqSection";

type Lang = "nl" | "ca" | "en" | "es";
type StatusFilter = "all" | "available" | "offered";
type SortOption = "manual" | "price_asc" | "price_desc";

type TotalsRow = {
  item_id: string;
  paid_cents: number;
  reported_cents: number;
};

type ViewRow = {
  id: string;
  slug: string;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  sort_order: number | null;
  is_active: boolean;
  category: string | null;
  is_contribution_item: boolean;
  lang: Lang;
  title: string;
  description: string | null;
};

type UiItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  sort_order: number;
  category: string | null;
  is_contribution_item: boolean;
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
    travel: "Desplaçaments",
    toys: "Joguines",
    clothes: "Roba",
    room: "Habitació",
    essentials: "Essencials",
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
    essentials: "Esenciales",
    other: "Otros",
  },
};

const uiText: Record<
  Lang,
  {
    pageTitle: string;
    loading: string;
    empty: string;
    chooseLanguage: string;
    total: string;
    target: string;
    confirmed: string;
    reported: string;
    available: string;
    alreadyOffered: string;
    full: string;
    noTarget: string;
    ofGoal: string;
    filters: string;
    category: string;
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
    pageTitle: "Geboortelijst",
    loading: "Laden...",
    empty: "Er zijn momenteel geen items beschikbaar.",
    chooseLanguage: "Taal",
    total: "Totaal",
    target: "Doel",
    confirmed: "Bevestigd",
    reported: "Aangekondigd",
    available: "Beschikbaar",
    alreadyOffered: "Al aangeboden",
    full: "Volzet",
    noTarget: "Geen doelbedrag",
    ofGoal: "van doel",
    filters: "Filters",
    category: "Categorie",
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
    pageTitle: "Llista de naixement",
    loading: "Carregant...",
    empty: "Actualment no hi ha articles disponibles.",
    chooseLanguage: "Idioma",
    total: "Total",
    target: "Objectiu",
    confirmed: "Confirmat",
    reported: "Anunciat",
    available: "Disponible",
    alreadyOffered: "Ja ofert",
    full: "Complet",
    noTarget: "Sense import objectiu",
    ofGoal: "de l’objectiu",
    filters: "Filtres",
    category: "Categoria",
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
    pageTitle: "Baby Registry",
    loading: "Loading...",
    empty: "There are currently no items available.",
    chooseLanguage: "Language",
    total: "Total",
    target: "Target",
    confirmed: "Confirmed",
    reported: "Reported",
    available: "Available",
    alreadyOffered: "Already offered",
    full: "Fully funded",
    noTarget: "No target amount",
    ofGoal: "of goal",
    filters: "Filters",
    category: "Category",
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
    pageTitle: "Lista de nacimiento",
    loading: "Cargando...",
    empty: "Actualmente no hay artículos disponibles.",
    chooseLanguage: "Idioma",
    total: "Total",
    target: "Objetivo",
    confirmed: "Confirmado",
    reported: "Anunciado",
    available: "Disponible",
    alreadyOffered: "Ya ofrecido",
    full: "Completo",
    noTarget: "Sin importe objetivo",
    ofGoal: "del objetivo",
    filters: "Filtros",
    category: "Categoría",
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

const languageOptions: { code: Lang; label: string }[] = [
  { code: "nl", label: "Nederlands" },
  { code: "ca", label: "Català" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

function euro(cents: number, lang: Lang) {
  const locale =
    lang === "nl" ? "nl-BE" : lang === "ca" ? "ca-ES" : lang === "es" ? "es-ES" : "en-GB";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeCategory(value: string | null | undefined) {
  const cleaned = (value ?? "").trim().toLowerCase();
  if (!cleaned) return "other";

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

  return aliases[cleaned] ?? cleaned;
}

export default function RegistryPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const routeLang = params.lang ?? "nl";
  const lang: Lang = ["nl", "ca", "en", "es"].includes(routeLang)
    ? (routeLang as Lang)
    : "nl";

  const [items, setItems] = useState<UiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("manual");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const t = uiText[lang];

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);

      const [{ data: viewData, error: viewError }, { data: totalsData, error: totalsError }] =
        await Promise.all([
          supabase
            .from("items_with_translations")
            .select(
              "id,slug,image_url,already_owned,target_cents,sort_order,is_active,category,is_contribution_item,lang,title,description"
            )
            .eq("lang", lang)
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase.from("item_totals").select("item_id,paid_cents,reported_cents"),
        ]);

      if (viewError || totalsError) {
        console.error(viewError || totalsError);
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const totalsMap: Record<string, TotalsRow> = {};
      ((totalsData ?? []) as TotalsRow[]).forEach((row) => {
        totalsMap[row.item_id] = {
          item_id: row.item_id,
          paid_cents: Number(row.paid_cents ?? 0),
          reported_cents: Number(row.reported_cents ?? 0),
        };
      });

      const mapped: UiItem[] = ((viewData ?? []) as ViewRow[])
        .filter((row) => row.slug && row.title)
        .map((row) => {
          const totals = totalsMap[row.id];

          return {
            id: row.id,
            slug: row.slug,
            title: row.title,
            description: row.description ?? null,
            image_url: row.image_url,
            already_owned: row.already_owned,
            target_cents: row.target_cents,
            sort_order: Number(row.sort_order ?? 0),
            category: row.category,
            is_contribution_item: row.is_contribution_item,
            paid_cents: totals?.paid_cents ?? 0,
            reported_cents: totals?.reported_cents ?? 0,
          };
        });

      if (!cancelled) {
        setItems(mapped);
        setLoading(false);
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const cards = useMemo(() => {
    return items.map((item) => {
      const total = item.paid_cents + item.reported_cents;
      const target = item.target_cents ?? 0;
      const reached = item.is_contribution_item && target > 0 && total >= target;
      const unavailable = item.already_owned || reached;
      const progress = target > 0 ? clamp01(total / target) : 0;
      const paidProgress = target > 0 ? clamp01(item.paid_cents / target) : 0;
      const categoryKey = normalizeCategory(item.category);
      const overlayText = item.already_owned
        ? t.alreadyOffered
        : reached
        ? t.full
        : null;

      return {
        ...item,
        total,
        target,
        reached,
        unavailable,
        progress,
        paidProgress,
        pct: Math.round(progress * 100),
        categoryKey,
        categoryLabel: categoryLabels[lang][categoryKey] ?? categoryLabels[lang].other,
        displayPrice: item.target_cents ?? 0,
        overlayText,
      };
    });
  }, [items, lang, t.alreadyOffered, t.full]);

  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(cards.map((c) => c.categoryKey)));
    const preferred = [
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
    return preferred.filter((c) => categories.includes(c));
  }, [cards]);

  useEffect(() => {
    if (selectedCategory === "all") return;
    if (!availableCategories.includes(selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [availableCategories, selectedCategory]);

  const visibleCards = useMemo(() => {
    let result = [...cards];

    if (selectedCategory !== "all") {
      result = result.filter((card) => card.categoryKey === selectedCategory);
    }

    if (statusFilter === "available") {
      result = result.filter((card) => !card.unavailable);
    } else if (statusFilter === "offered") {
      result = result.filter((card) => card.unavailable);
    }

    if (sortOption === "price_asc") {
      result.sort((a, b) => a.displayPrice - b.displayPrice);
    } else if (sortOption === "price_desc") {
      result.sort((a, b) => b.displayPrice - a.displayPrice);
    } else {
      result.sort((a, b) => a.sort_order - b.sort_order);
    }

    return result;
  }, [cards, selectedCategory, statusFilter, sortOption]);

  return (
    <main className="min-h-screen bg-[#f8f6f2] pb-16">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl text-[#5e6a50]">{t.pageTitle}</h1>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#7c8570]">{t.chooseLanguage}</span>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((option) => {
                const active = option.code === lang;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => router.push(`/${option.code}`)}
                    className={[
                      "rounded-full px-3 py-2 text-sm transition",
                      active
                        ? "bg-[#5e6a50] text-white"
                        : "bg-white text-[#5e6a50] ring-1 ring-[#d8ddd1] hover:bg-[#f3f1eb]",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-[#5e6a50] shadow-sm ring-1 ring-[#d8ddd1]">
            {t.loading}
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-[#5e6a50] shadow-sm ring-1 ring-[#d8ddd1]">
            {t.empty}
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#d8ddd1] md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-[#7c8570]">{t.category}</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-sm text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                >
                  <option value="all">{categoryLabels[lang].all}</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[lang][category] ?? categoryLabels[lang].other}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#7c8570]">{t.status}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-sm text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                >
                  <option value="all">{t.statusAll}</option>
                  <option value="available">{t.statusAvailable}</option>
                  <option value="offered">{t.statusOffered}</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#7c8570]">{t.sort}</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-sm text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                >
                  <option value="manual">{t.sortManual}</option>
                  <option value="price_asc">{t.sortPriceAsc}</option>
                  <option value="price_desc">{t.sortPriceDesc}</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCards.map((item) => {
                const statusText = item.already_owned
                  ? t.alreadyOffered
                  : item.reached
                  ? t.full
                  : t.available;

                const statusClass = item.already_owned
                  ? "bg-[#ecefe7] text-[#5e6a50]"
                  : item.reached
                  ? "bg-[#dfe7d7] text-[#4f5a44]"
                  : "bg-[#f4efe3] text-[#8a7753]";

                const ctaText = item.is_contribution_item ? t.contribute : t.offer;

                return (
                  <article
                    key={item.id}
                    className={[
                      "flex min-h-[620px] flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#d8ddd1] transition",
                      item.unavailable ? "opacity-80" : "hover:-translate-y-0.5 hover:shadow-md",
                    ].join(" ")}
                  >
                    <div className="relative aspect-[4/3] bg-[#f3f1eb]">
                      {item.image_url ? (
                        <>
                          <Image
  src={item.image_url}
  alt={item.title}
  fill
  style={
    item.unavailable
      ? { filter: "grayscale(100%)", opacity: 0.6 }
      : undefined
  }
  className="object-contain p-3 transition duration-300"
/>
                          {item.overlayText ? (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-[#5e6a50] shadow">
                                {item.overlayText}
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#8d9484]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-lg text-[#5e6a50]">{item.title}</h3>

                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className="inline-flex rounded-full bg-[#ecefe7] px-3 py-1 text-xs text-[#5e6a50]">
                          {item.categoryLabel}
                        </span>
                      </div>

                      {item.description ? (
                        <p className="mb-4 text-sm leading-6 text-[#7c8570]">{item.description}</p>
                      ) : null}

                      <div className="mt-auto">
                        {item.is_contribution_item ? (
                          <div className="mb-5">
                            <div className="mb-2 flex items-center justify-between text-sm text-[#7c8570]">
                              <span>
                                {t.total}: <span className="text-[#5e6a50]">{euro(item.total, lang)}</span>
                              </span>
                              <span>
                                {t.target}: <span className="text-[#5e6a50]">{euro(item.target, lang)}</span>
                              </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-[#e8ebe3]">
                              <div
                                className="h-full rounded-full bg-[#cfd5c7]"
                                style={{ width: `${item.pct}%` }}
                              />
                              <div
                                className="-mt-2.5 h-full rounded-full bg-[#5e6a50]"
                                style={{ width: `${Math.round(item.paidProgress * 100)}%` }}
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs text-[#9ba292]">
                              <span>
                                {t.confirmed}: {euro(item.paid_cents, lang)}
                              </span>
                              <span>
                                {t.reported}: {euro(item.reported_cents, lang)}
                              </span>
                            </div>
                          </div>
                        ) : item.target_cents ? (
                          <div className="mb-5 text-sm text-[#7c8570]">
                            {t.target}:{" "}
                            <span className="text-[#5e6a50]">{euro(item.target_cents, lang)}</span>
                          </div>
                        ) : (
                          <div className="mb-5" />
                        )}

                        <div className="mt-auto flex gap-3">
                          <button
                            type="button"
                            disabled={item.unavailable}
                            onClick={() => {
                              if (!item.unavailable) {
                                router.push(`/${lang}/item/${item.slug}`);
                              }
                            }}
                            className={[
                              "flex-1 rounded-2xl px-4 py-3 text-sm transition",
                              item.unavailable
                                ? "cursor-not-allowed bg-[#ece8df] text-[#7c8570]"
                                : "bg-[#5e6a50] text-white hover:opacity-90",
                            ].join(" ")}
                          >
                            {item.unavailable ? statusText : ctaText}
                          </button>

                          {!item.is_contribution_item ? (
                            <button
                              type="button"
                              disabled={item.unavailable}
                              onClick={() => {
                                if (!item.unavailable) {
                                  router.push(`/${lang}/item/${item.slug}`);
                                }
                              }}
                              className={[
                                "rounded-2xl px-4 py-3 text-sm transition",
                                item.unavailable
                                  ? "cursor-not-allowed bg-[#f3f1eb] text-[#c0c5bc]"
                                  : "bg-[#f3f1eb] text-[#5e6a50] hover:bg-[#ece8df]",
                              ].join(" ")}
                              aria-label={ctaText}
                            >
                              +
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-10">
          <RegistryFaqSection lang={lang} compact />
        </div>
      </div>
    </main>
  );
}