"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "nl" | "ca" | "en" | "es";

type Item = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  is_open: boolean;
  category: string | null;
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
    alreadyBought: string;
    full: string;
    available: string;
    noTarget: string;
    ofGoal: string;
    darkConfirmed: string;
  }
> = {
  nl: {
    title: "Geboortelijst",
    subtitle: "Kies een cadeau en draag bij aan een item.",
    empty: "Er staan momenteel geen open items op de geboortelijst.",
    loading: "Laden…",
    total: "Totaal",
    target: "Doel",
    confirmed: "bevestigd",
    reported: "gemeld",
    alreadyBought: "Al gekocht",
    full: "Volzet",
    available: "Beschikbaar",
    noTarget: "Geen doelbedrag ingesteld",
    ofGoal: "van doel",
    darkConfirmed: "donker = bevestigd",
  },
  ca: {
    title: "Llista de naixement",
    subtitle: "Tria un regal i contribueix a un article.",
    empty: "Actualment no hi ha articles oberts a la llista de naixement.",
    loading: "Carregant…",
    total: "Total",
    target: "Objectiu",
    confirmed: "confirmat",
    reported: "anunciat",
    alreadyBought: "Ja comprat",
    full: "Complet",
    available: "Disponible",
    noTarget: "No hi ha import objectiu",
    ofGoal: "de l’objectiu",
    darkConfirmed: "fosc = confirmat",
  },
  en: {
    title: "Baby Registry",
    subtitle: "Choose a gift and contribute to an item.",
    empty: "There are currently no open items on the baby registry.",
    loading: "Loading…",
    total: "Total",
    target: "Target",
    confirmed: "confirmed",
    reported: "reported",
    alreadyBought: "Already bought",
    full: "Fully funded",
    available: "Available",
    noTarget: "No target amount set",
    ofGoal: "of goal",
    darkConfirmed: "dark = confirmed",
  },
  es: {
    title: "Lista de nacimiento",
    subtitle: "Elige un regalo y contribuye a un artículo.",
    empty: "Actualmente no hay artículos abiertos en la lista de nacimiento.",
    loading: "Cargando…",
    total: "Total",
    target: "Objetivo",
    confirmed: "confirmado",
    reported: "anunciado",
    alreadyBought: "Ya comprado",
    full: "Completo",
    available: "Disponible",
    noTarget: "No hay importe objetivo",
    ofGoal: "del objetivo",
    darkConfirmed: "oscuro = confirmado",
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

    clothes: "clothes",
    clothing: "clothes",
    kleding: "clothes",
    textiles: "clothes",

    room: "room",
    nursery: "room",
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
  const lang = ((params.lang ?? "nl") as Lang) || "nl";
  const t = uiText[lang];

  const [items, setItems] = useState<Item[]>([]);
  const [totals, setTotals] = useState<Record<string, TotalsRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
              .from("items")
              .select(
                "id,slug,title,description,image_url,already_owned,target_cents,is_open,category"
              )
              .eq("is_open", true)
              .order("sort_order", { ascending: true }),
            supabase
              .from("item_totals")
              .select("item_id,paid_cents,reported_cents"),
          ]);

        if (e1) throw e1;
        if (e2) throw new Error(`Kan totals niet laden: ${e2.message}`);

        const list = (itemsData ?? []) as Item[];

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
        setError(err instanceof Error ? err.message : "Onbekende fout");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const reached = target > 0 && total >= target;
      const disabled = it.already_owned || reached;
      const categoryKey = normalizeCategory(it.category);
      const categoryLabel = getCategoryLabel(lang, it.category);

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
        disabled,
        categoryKey,
        categoryLabel,
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
    if (selectedCategory === "all") {
      return cards;
    }

    return cards.filter((card) => card.categoryKey === selectedCategory);
  }, [cards, selectedCategory]);

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
        Fout: {error}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl text-[#5e6a50]">{t.title}</h1>

        <div className="mt-2 text-sm text-[#7c8570]">{t.subtitle}</div>

        {cards.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#d8ddd1] bg-white p-6 text-sm text-[#6c7561] shadow-sm">
            {t.empty}
          </div>
        ) : (
          <>
            <div className="relative mt-5">
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

              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#f8f6f2] to-transparent" />
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
                  disabled,
                  categoryLabel,
                }) => (
                  <button
                    key={it.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) {
                        router.push(`/${lang}/item/${it.slug}`);
                      }
                    }}
                    className={[
                      "rounded-2xl border border-[#d8ddd1] bg-white p-4 text-left shadow-sm transition",
                      disabled
                        ? "cursor-not-allowed opacity-60"
                        : "hover:-translate-y-0.5 hover:shadow-md",
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

                        <div className="text-base text-[#5e6a50]">
                          {it.title}
                        </div>

                        {it.description ? (
                          <div className="mt-1 line-clamp-2 text-sm text-[#7c8570]">
                            {it.description}
                          </div>
                        ) : null}
                      </div>

                      {it.already_owned ? (
                        <span className="shrink-0 rounded-full bg-[#ecefe7] px-3 py-1 text-xs text-[#5e6a50]">
                          {t.alreadyBought}
                        </span>
                      ) : reached ? (
                        <span className="shrink-0 rounded-full bg-[#dfe7d7] px-3 py-1 text-xs text-[#4f5a44]">
                          {t.full}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-[#f4efe3] px-3 py-1 text-xs text-[#8a7753]">
                          {t.available}
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-start justify-between gap-4 text-sm">
                        <div className="text-[#7c8570]">
                          <div>
                            {t.total}:{" "}
                            <span className="text-[#5e6a50]">
                              {euro(total, lang)}
                            </span>
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
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}