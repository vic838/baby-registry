"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Lang = "nl" | "ca" | "en" | "es";

type CartLine =
  | {
      type: "item";
      itemId: string;
      slug: string;
      title: string;
      image_url: string | null;
      quantity: number;
      unit_cents: number;
      addedAt: string;
    }
  | {
      type: "contribution";
      itemId: string;
      slug: string;
      title: string;
      image_url: string | null;
      amount_cents: number;
      addedAt: string;
    };

const CART_STORAGE_KEY = "birthlist_cart_v1";

const uiText: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    empty: string;
    backToRegistry: string;
    continueShopping: string;
    clearCart: string;
    remove: string;
    contribution: string;
    totalItems: string;
    totalAmount: string;
    classicItems: string;
    contributionItems: string;
    noImage: string;
    summary: string;
    itemAmount: string;
    checkout: string;
  }
> = {
  nl: {
    title: "Mandje",
    subtitle: "Overzicht van geselecteerde items en bijdragen.",
    empty: "Je mandje is nog leeg.",
    backToRegistry: "← Terug naar lijst",
    continueShopping: "Verder kijken",
    clearCart: "Mandje leegmaken",
    remove: "Verwijderen",
    contribution: "Bijdrage",
    totalItems: "Totaal items",
    totalAmount: "Totaalbedrag",
    classicItems: "Items",
    contributionItems: "Bijdragen",
    noImage: "Geen afbeelding",
    summary: "Samenvatting",
    itemAmount: "Bedrag",
    checkout: "Naar checkout",
  },
  ca: {
    title: "Cistella",
    subtitle: "Resum dels articles i contribucions seleccionats.",
    empty: "La cistella encara és buida.",
    backToRegistry: "← Tornar a la llista",
    continueShopping: "Continuar mirant",
    clearCart: "Buida la cistella",
    remove: "Eliminar",
    contribution: "Contribució",
    totalItems: "Total d'articles",
    totalAmount: "Import total",
    classicItems: "Articles",
    contributionItems: "Contribucions",
    noImage: "Sense imatge",
    summary: "Resum",
    itemAmount: "Import",
    checkout: "Anar al checkout",
  },
  en: {
    title: "Cart",
    subtitle: "Overview of selected items and contributions.",
    empty: "Your cart is still empty.",
    backToRegistry: "← Back to list",
    continueShopping: "Continue browsing",
    clearCart: "Clear cart",
    remove: "Remove",
    contribution: "Contribution",
    totalItems: "Total items",
    totalAmount: "Total amount",
    classicItems: "Items",
    contributionItems: "Contributions",
    noImage: "No image",
    summary: "Summary",
    itemAmount: "Amount",
    checkout: "Go to checkout",
  },
  es: {
    title: "Carrito",
    subtitle: "Resumen de artículos y contribuciones seleccionados.",
    empty: "Tu carrito todavía está vacío.",
    backToRegistry: "← Volver a la lista",
    continueShopping: "Seguir mirando",
    clearCart: "Vaciar carrito",
    remove: "Eliminar",
    contribution: "Contribución",
    totalItems: "Total de artículos",
    totalAmount: "Importe total",
    classicItems: "Artículos",
    contributionItems: "Contribuciones",
    noImage: "Sin imagen",
    summary: "Resumen",
    itemAmount: "Importe",
    checkout: "Ir al checkout",
  },
};

function getSafeLang(value?: string): Lang {
  if (value === "nl" || value === "ca" || value === "en" || value === "es") {
    return value;
  }
  return "nl";
}

function euro(cents: number, lang: Lang) {
  const locale =
    lang === "nl" ? "nl-BE" : lang === "ca" ? "ca-ES" : lang === "es" ? "es-ES" : "en-GB";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("birthlist-cart-updated"));
}

export default function CartPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = getSafeLang(params?.lang);
  const t = uiText[lang];

  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      setCart(readCart());
      setLoaded(true);
    };

    load();

    const onStorage = () => load();
    const onCartUpdated = () => load();

    window.addEventListener("storage", onStorage);
    window.addEventListener("birthlist-cart-updated", onCartUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("birthlist-cart-updated", onCartUpdated);
    };
  }, []);

  const classicItems = useMemo(
    () => cart.filter((line) => line.type === "item") as Extract<CartLine, { type: "item" }>[],
    [cart]
  );

  const contributionItems = useMemo(
    () =>
      cart.filter(
        (line) => line.type === "contribution"
      ) as Extract<CartLine, { type: "contribution" }>[],
    [cart]
  );

  const totalItemCount = useMemo(
    () => classicItems.length + contributionItems.length,
    [classicItems, contributionItems]
  );

  const totalAmountCents = useMemo(() => {
    const classicTotal = classicItems.reduce(
      (sum, line) => sum + Math.max(0, Number(line.unit_cents || 0)),
      0
    );

    const contributionTotal = contributionItems.reduce(
      (sum, line) => sum + Math.max(0, Number(line.amount_cents || 0)),
      0
    );

    return classicTotal + contributionTotal;
  }, [classicItems, contributionItems]);

  function removeLine(target: CartLine) {
    const next = cart.filter((line) => {
      if (target.type !== line.type) return true;

      if (line.type === "item" && target.type === "item") {
        return line.itemId !== target.itemId;
      }

      if (line.type === "contribution" && target.type === "contribution") {
        return !(
          line.itemId === target.itemId &&
          line.amount_cents === target.amount_cents &&
          line.addedAt === target.addedAt
        );
      }

      return true;
    });

    setCart(next);
    writeCart(next);
  }

  function clearCart() {
    setCart([]);
    writeCart([]);
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/registry`)}
          className="mb-6 text-sm text-[#5e6a50] transition hover:opacity-80"
        >
          {t.backToRegistry}
        </button>

        <div className="mb-6">
          <h1 className="text-3xl text-[#5e6a50]">{t.title}</h1>
          <p className="mt-2 text-[#7c8570]">{t.subtitle}</p>
        </div>

        {!loaded ? null : cart.length === 0 ? (
          <div className="rounded-3xl border border-[#d8ddd1] bg-white p-6 shadow-sm">
            <div className="text-[#5e6a50]">{t.empty}</div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push(`/${lang}/registry`)}
                className="rounded-2xl bg-[#5e6a50] px-5 py-3 text-white transition hover:opacity-90"
              >
                {t.continueShopping}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-6">
              {classicItems.length > 0 ? (
                <section className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-xl text-[#5e6a50]">{t.classicItems}</h2>

                  <div className="space-y-4">
                    {classicItems.map((line) => (
                      <div
                        key={`item-${line.itemId}`}
                        className="grid gap-4 rounded-2xl border border-[#e7eadf] bg-[#fcfbf8] p-4 sm:grid-cols-[96px_1fr_auto]"
                      >
                        <div className="overflow-hidden rounded-xl bg-[#f3f1eb]">
                          {line.image_url ? (
                            <img
                              src={line.image_url}
                              alt={line.title}
                              className="h-24 w-24 object-cover"
                            />
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center text-center text-xs text-[#8d9484]">
                              {t.noImage}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/${lang}/item/${line.slug}`)}
                            className="text-left text-lg text-[#5e6a50] hover:opacity-80"
                          >
                            {line.title}
                          </button>

                          <div className="mt-3 text-sm text-[#7c8570]">
                            {t.itemAmount}: {euro(line.unit_cents, lang)}
                          </div>
                        </div>

                        <div className="flex items-start justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(line)}
                            className="rounded-xl border border-[#d8ddd1] px-3 py-2 text-sm text-[#5e6a50] transition hover:bg-[#f7f5ef]"
                          >
                            {t.remove}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {contributionItems.length > 0 ? (
                <section className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-xl text-[#5e6a50]">{t.contributionItems}</h2>

                  <div className="space-y-4">
                    {contributionItems.map((line) => (
                      <div
                        key={`contribution-${line.itemId}-${line.addedAt}`}
                        className="grid gap-4 rounded-2xl border border-[#e7eadf] bg-[#fcfbf8] p-4 sm:grid-cols-[96px_1fr_auto]"
                      >
                        <div className="overflow-hidden rounded-xl bg-[#f3f1eb]">
                          {line.image_url ? (
                            <img
                              src={line.image_url}
                              alt={line.title}
                              className="h-24 w-24 object-cover"
                            />
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center text-center text-xs text-[#8d9484]">
                              {t.noImage}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/${lang}/item/${line.slug}`)}
                            className="text-left text-lg text-[#5e6a50] hover:opacity-80"
                          >
                            {line.title}
                          </button>

                          <div className="mt-3 text-sm text-[#7c8570]">
                            {t.contribution}: {euro(line.amount_cents, lang)}
                          </div>
                        </div>

                        <div className="flex items-start justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(line)}
                            className="rounded-xl border border-[#d8ddd1] px-3 py-2 text-sm text-[#5e6a50] transition hover:bg-[#f7f5ef]"
                          >
                            {t.remove}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="h-fit rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xl text-[#5e6a50]">{t.summary}</h2>

              <div className="space-y-3 text-[#5e6a50]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#7c8570]">{t.totalItems}</span>
                  <span>{totalItemCount}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#7c8570]">{t.totalAmount}</span>
                  <span>{euro(totalAmountCents, lang)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => router.push(`/${lang}/checkout`)}
                  className="w-full rounded-2xl bg-[#5e6a50] px-5 py-3 text-white transition hover:opacity-90"
                >
                  {t.checkout}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/${lang}/registry`)}
                  className="w-full rounded-2xl border border-[#d8ddd1] px-5 py-3 text-[#5e6a50] transition hover:bg-[#f7f5ef]"
                >
                  {t.continueShopping}
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full rounded-2xl border border-[#d8ddd1] px-5 py-3 text-[#5e6a50] transition hover:bg-[#f7f5ef]"
                >
                  {t.clearCart}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}