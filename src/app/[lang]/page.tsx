"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "nl" | "ca" | "en" | "es";

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
    contribute: string;
    viewDetails: string;
    alreadyGifted: string;
    funded: string;
    reported: string;
    chooseLanguage: string;
    contributionItem: string;
    giftItem: string;
    loading: string;
    close: string;
    empty: string;
  }
> = {
  nl: {
    pageTitle: "Geboortelijst",
    contribute: "Bijdragen",
    viewDetails: "Bekijk item",
    alreadyGifted: "Reeds voorzien",
    funded: "Bevestigd",
    reported: "Aangekondigd",
    chooseLanguage: "Taal",
    contributionItem: "Bijdrage-item",
    giftItem: "Cadeau-item",
    loading: "Laden...",
    close: "Sluiten",
    empty: "Er zijn momenteel geen items beschikbaar.",
  },
  ca: {
    pageTitle: "Llista de naixement",
    contribute: "Contribuir",
    viewDetails: "Veure article",
    alreadyGifted: "Ja previst",
    funded: "Confirmat",
    reported: "Anunciat",
    chooseLanguage: "Idioma",
    contributionItem: "Article de contribució",
    giftItem: "Article regal",
    loading: "Carregant...",
    close: "Tancar",
    empty: "Actualment no hi ha articles disponibles.",
  },
  en: {
    pageTitle: "Baby Registry",
    contribute: "Contribute",
    viewDetails: "View item",
    alreadyGifted: "Already covered",
    funded: "Funded",
    reported: "Reported",
    chooseLanguage: "Language",
    contributionItem: "Contribution item",
    giftItem: "Gift item",
    loading: "Loading...",
    close: "Close",
    empty: "There are currently no items available.",
  },
  es: {
    pageTitle: "Lista de nacimiento",
    contribute: "Contribuir",
    viewDetails: "Ver artículo",
    alreadyGifted: "Ya previsto",
    funded: "Financiado",
    reported: "Anunciado",
    chooseLanguage: "Idioma",
    contributionItem: "Artículo de contribución",
    giftItem: "Artículo regalo",
    loading: "Cargando...",
    close: "Cerrar",
    empty: "Actualmente no hay artículos disponibles.",
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
  const [selectedItem, setSelectedItem] = useState<UiItem | null>(null);

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

      if (viewError) {
        console.error(viewError);
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      if (totalsError) {
        console.error(totalsError);
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

  const groupedItems = useMemo(() => {
    const groups = new Map<string, UiItem[]>();

    for (const item of items) {
      const key = normalizeCategory(item.category);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    return Array.from(groups.entries())
      .map(([key, groupItems]) => ({
        key,
        label: categoryLabels[lang][key] ?? categoryLabels[lang].other,
        items: groupItems.sort((a, b) => a.sort_order - b.sort_order),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items, lang]);

  const t = uiText[lang];

  function goToItem(item: UiItem) {
    router.push(`/${lang}/item/${item.slug}`);
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2] pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl text-[#5e6a50]">{t.pageTitle}</h1>
          </div>

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
        ) : groupedItems.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-[#5e6a50] shadow-sm ring-1 ring-[#d8ddd1]">
            {t.empty}
          </div>
        ) : (
          <div className="space-y-10">
            {groupedItems.map((group) => (
              <section key={group.key}>
                <h2 className="mb-4 text-xl text-[#5e6a50]">{group.label}</h2>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => {
                    const funded = item.paid_cents;
                    const reported = item.reported_cents;
                    const target = item.target_cents ?? 0;
                    const progress =
                      target > 0 ? clamp01((funded + reported) / target) : 0;

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#d8ddd1]"
                      >
                        <div className="relative aspect-[4/3] bg-[#f3f1eb]">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.title}
                              fill
                              className="object-contain p-3"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-[#8d9484]">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h3 className="text-lg text-[#5e6a50]">
                              {item.title}
                            </h3>

                            <span className="rounded-full bg-[#ecefe7] px-2.5 py-1 text-xs text-[#5e6a50]">
                              {item.is_contribution_item
                                ? t.contributionItem
                                : t.giftItem}
                            </span>
                          </div>

                          {item.description ? (
                            <p className="mb-4 text-sm leading-6 text-[#7c8570]">
                              {item.description}
                            </p>
                          ) : null}

                          {item.already_owned ? (
                            <div className="mb-4 rounded-2xl bg-[#ecefe7] px-3 py-2 text-sm text-[#5e6a50]">
                              {t.alreadyGifted}
                            </div>
                          ) : null}

                          {item.is_contribution_item && item.target_cents ? (
                            <div className="mb-5">
                              <div className="mb-2 flex items-center justify-between text-sm text-[#7c8570]">
                                <span>{euro(funded + reported, lang)}</span>
                                <span>{euro(item.target_cents, lang)}</span>
                              </div>

                              <div className="h-2.5 overflow-hidden rounded-full bg-[#e8ebe3]">
                                <div
                                  className="h-full rounded-full bg-[#5e6a50] transition-all"
                                  style={{ width: `${progress * 100}%` }}
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-between text-xs text-[#9ba292]">
                                <span>
                                  {t.funded}: {euro(funded, lang)}
                                </span>
                                <span>
                                  {t.reported}: {euro(reported, lang)}
                                </span>
                              </div>
                            </div>
                          ) : null}

                          <div className="flex gap-3">
                            {item.is_contribution_item && !item.already_owned ? (
                              <button
                                type="button"
                                onClick={() => goToItem(item)}
                                className="flex-1 rounded-2xl bg-[#5e6a50] px-4 py-3 text-sm text-white transition hover:opacity-90"
                              >
                                {t.contribute}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => goToItem(item)}
                                className="flex-1 rounded-2xl bg-[#f3f1eb] px-4 py-3 text-sm text-[#5e6a50] transition hover:bg-[#ece8df]"
                              >
                                {t.viewDetails}
                              </button>
                            )}

                            {!item.is_contribution_item ? (
                              <button
                                type="button"
                                onClick={() => goToItem(item)}
                                className="rounded-2xl bg-[#f3f1eb] px-4 py-3 text-sm text-[#5e6a50] transition hover:bg-[#ece8df]"
                              >
                                +
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {selectedItem ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 p-4 md:items-center md:justify-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-3 text-xl text-[#5e6a50]">
              {selectedItem.title}
            </h3>

            {selectedItem.description ? (
              <p className="mb-4 text-sm leading-6 text-[#7c8570]">
                {selectedItem.description}
              </p>
            ) : null}

            {selectedItem.is_contribution_item && selectedItem.target_cents ? (
              <p className="mb-6 text-sm text-[#7c8570]">
                {euro(
                  selectedItem.paid_cents + selectedItem.reported_cents,
                  lang
                )}{" "}
                / {euro(selectedItem.target_cents, lang)}
              </p>
            ) : null}

            <div className="flex gap-3">
              {selectedItem.is_contribution_item && !selectedItem.already_owned ? (
                <button
                  type="button"
                  onClick={() => goToItem(selectedItem)}
                  className="flex-1 rounded-2xl bg-[#5e6a50] px-4 py-3 text-sm text-white"
                >
                  {t.contribute}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex-1 rounded-2xl bg-[#f3f1eb] px-4 py-3 text-sm text-[#5e6a50]"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedItem && selectedItem.is_contribution_item && !selectedItem.already_owned ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8ddd1] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => goToItem(selectedItem)}
            className="w-full rounded-2xl bg-[#5e6a50] px-4 py-3 text-sm text-white"
          >
            {t.contribute}
          </button>
        </div>
      ) : null}
    </main>
  );
}