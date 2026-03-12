"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Lang = "nl" | "ca" | "en" | "es";

type TranslationRow = {
  lang: Lang;
  title: string;
  description: string | null;
};

type TotalsRow = {
  paid_cents: number;
  reported_cents: number;
};

type ItemRow = {
  id: string;
  slug: string;
  image_url: string | null;
  already_owned: boolean;
  target_cents: number | null;
  sort_order: number;
  is_active: boolean;
  category: string | null;
  is_contribution_item: boolean;
  item_translations: TranslationRow[];
  item_totals: TotalsRow[] | null;
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
    feeding: "Voeden",
    care: "Verzorging",
    travel: "Onderweg",
    toys: "Speelgoed",
    clothes: "Kleding",
    room: "Kamertje",
    essentials: "Essentials",
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
    contribute: string;
    viewDetails: string;
    alreadyGifted: string;
    funded: string;
    reported: string;
    chooseLanguage: string;
    contributionItem: string;
    giftItem: string;
  }
> = {
  nl: {
    contribute: "Bijdragen",
    viewDetails: "Bekijk item",
    alreadyGifted: "Reeds voorzien",
    funded: "Gefinancierd",
    reported: "Aangekondigd",
    chooseLanguage: "Taal",
    contributionItem: "Bijdrage-item",
    giftItem: "Cadeau-item",
  },
  ca: {
    contribute: "Contribuir",
    viewDetails: "Veure article",
    alreadyGifted: "Ja previst",
    funded: "Finançat",
    reported: "Anunciat",
    chooseLanguage: "Idioma",
    contributionItem: "Article de contribució",
    giftItem: "Article regal",
  },
  en: {
    contribute: "Contribute",
    viewDetails: "View item",
    alreadyGifted: "Already covered",
    funded: "Funded",
    reported: "Reported",
    chooseLanguage: "Language",
    contributionItem: "Contribution item",
    giftItem: "Gift item",
  },
  es: {
    contribute: "Contribuir",
    viewDetails: "Ver artículo",
    alreadyGifted: "Ya previsto",
    funded: "Financiado",
    reported: "Anunciado",
    chooseLanguage: "Idioma",
    contributionItem: "Artículo de contribución",
    giftItem: "Artículo regalo",
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
    lang === "nl" ? "nl-BE" :
    lang === "ca" ? "ca-ES" :
    lang === "es" ? "es-ES" :
    "en-GB";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeCategory(value: string | null | undefined) {
  if (!value) return "other";
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return "other";
  return cleaned;
}

function categoryLabel(lang: Lang, category: string | null) {
  const key = normalizeCategory(category);
  return categoryLabels[lang][key] ?? category ?? categoryLabels[lang].other;
}

export default function RegistryPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = (params.lang ?? "nl") as Lang;

  const [items, setItems] = useState<UiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<UiItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);

      const { data, error } = await supabase
        .from("items")
        .select(`
          id,
          slug,
          image_url,
          already_owned,
          target_cents,
          sort_order,
          is_active,
          category,
          is_contribution_item,
          item_translations!inner (
            lang,
            title,
            description
          ),
          item_totals (
            paid_cents,
            reported_cents
          )
        `)
        .eq("is_active", true)
        .eq("item_translations.lang", lang)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error(error);
        setItems([]);
        setLoading(false);
        return;
      }

      const mapped: UiItem[] = ((data ?? []) as ItemRow[]).map((row) => {
        const translation = row.item_translations?.[0];
        const totals = row.item_totals?.[0];

        return {
          id: row.id,
          slug: row.slug,
          title: translation?.title ?? row.slug,
          description: translation?.description ?? null,
          image_url: row.image_url,
          already_owned: row.already_owned,
          target_cents: row.target_cents,
          sort_order: row.sort_order,
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
        label: categoryLabel(lang, groupItems[0]?.category ?? key),
        items: groupItems.sort((a, b) => a.sort_order - b.sort_order),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items, lang]);

  const t = uiText[lang];

  return (
    <main className="min-h-screen bg-neutral-50 pb-28">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Baby Registry
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{t.chooseLanguage}</span>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((option) => {
                const active = option.code === lang;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => router.push(`/${option.code}`)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      active
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
            Loading...
          </div>
        ) : (
          <div className="space-y-10">
            {groupedItems.map((group) => (
              <section key={group.key}>
                <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                  {group.label}
                </h2>

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
                        className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-neutral-200"
                      >
                        <div className="relative aspect-[4/3] bg-neutral-100">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {item.title}
                            </h3>

                            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                              {item.is_contribution_item ? t.contributionItem : t.giftItem}
                            </span>
                          </div>

                          {item.description ? (
                            <p className="mb-4 text-sm leading-6 text-neutral-600">
                              {item.description}
                            </p>
                          ) : null}

                          {item.already_owned ? (
                            <div className="mb-4 rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
                              {t.alreadyGifted}
                            </div>
                          ) : null}

                          {item.is_contribution_item && item.target_cents ? (
                            <div className="mb-5">
                              <div className="mb-2 flex items-center justify-between text-sm text-neutral-600">
                                <span>{euro(funded + reported, lang)}</span>
                                <span>{euro(item.target_cents, lang)}</span>
                              </div>

                              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
                                <div
                                  className="h-full rounded-full bg-neutral-900 transition-all"
                                  style={{ width: `${progress * 100}%` }}
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
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
                                onClick={() => router.push(`/${lang}/contribute/${item.slug}`)}
                                className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                              >
                                {t.contribute}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="flex-1 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200"
                              >
                                {t.viewDetails}
                              </button>
                            )}

                            {!item.is_contribution_item ? (
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200"
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
            <h3 className="mb-3 text-xl font-semibold text-neutral-900">
              {selectedItem.title}
            </h3>

            {selectedItem.description ? (
              <p className="mb-4 text-sm leading-6 text-neutral-600">
                {selectedItem.description}
              </p>
            ) : null}

            {selectedItem.is_contribution_item && selectedItem.target_cents ? (
              <p className="mb-6 text-sm text-neutral-500">
                {euro(selectedItem.paid_cents + selectedItem.reported_cents, lang)} /{" "}
                {euro(selectedItem.target_cents, lang)}
              </p>
            ) : null}

            <div className="flex gap-3">
              {selectedItem.is_contribution_item && !selectedItem.already_owned ? (
                <button
                  type="button"
                  onClick={() => router.push(`/${lang}/contribute/${selectedItem.slug}`)}
                  className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
                >
                  {t.contribute}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex-1 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedItem && selectedItem.is_contribution_item && !selectedItem.already_owned ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => router.push(`/${lang}/contribute/${selectedItem.slug}`)}
            className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
          >
            {t.contribute}
          </button>
        </div>
      ) : null}
    </main>
  );
}