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
    backToCart: string;
    empty: string;
    goToRegistry: string;
    summary: string;
    totalItems: string;
    totalAmount: string;
    classicItems: string;
    contributionItems: string;
    itemAmount: string;
    contribution: string;
    noImage: string;
    contactTitle: string;
    name: string;
    email: string;
    message: string;
    placeholderName: string;
    placeholderEmail: string;
    placeholderMessage: string;
    requiredName: string;
    invalidEmail: string;
    continueToPayment: string;
    saving: string;
  }
> = {
  nl: {
    title: "Checkout",
    subtitle: "Controleer je selectie en vul je gegevens in.",
    backToCart: "← Terug naar mandje",
    empty: "Je mandje is leeg.",
    goToRegistry: "Ga naar de lijst",
    summary: "Samenvatting",
    totalItems: "Totaal items",
    totalAmount: "Totaalbedrag",
    classicItems: "Items",
    contributionItems: "Bijdragen",
    itemAmount: "Bedrag",
    contribution: "Bijdrage",
    noImage: "Geen afbeelding",
    contactTitle: "Jouw gegevens",
    name: "Naam",
    email: "E-mail",
    message: "Bericht",
    placeholderName: "Je naam",
    placeholderEmail: "je@email.com",
    placeholderMessage: "Optioneel bericht",
    requiredName: "Vul je naam in.",
    invalidEmail: "Vul een geldig e-mailadres in.",
    continueToPayment: "Bevestigen en verder",
    saving: "Bezig…",
  },
  ca: {
    title: "Checkout",
    subtitle: "Revisa la selecció i omple les teves dades.",
    backToCart: "← Tornar a la cistella",
    empty: "La cistella és buida.",
    goToRegistry: "Anar a la llista",
    summary: "Resum",
    totalItems: "Total d'articles",
    totalAmount: "Import total",
    classicItems: "Articles",
    contributionItems: "Contribucions",
    itemAmount: "Import",
    contribution: "Contribució",
    noImage: "Sense imatge",
    contactTitle: "Les teves dades",
    name: "Nom",
    email: "Correu electrònic",
    message: "Missatge",
    placeholderName: "El teu nom",
    placeholderEmail: "tu@email.com",
    placeholderMessage: "Missatge opcional",
    requiredName: "Introdueix el teu nom.",
    invalidEmail: "Introdueix un correu electrònic vàlid.",
    continueToPayment: "Confirmar i continuar",
    saving: "En curs…",
  },
  en: {
    title: "Checkout",
    subtitle: "Review your selection and enter your details.",
    backToCart: "← Back to cart",
    empty: "Your cart is empty.",
    goToRegistry: "Go to the list",
    summary: "Summary",
    totalItems: "Total items",
    totalAmount: "Total amount",
    classicItems: "Items",
    contributionItems: "Contributions",
    itemAmount: "Amount",
    contribution: "Contribution",
    noImage: "No image",
    contactTitle: "Your details",
    name: "Name",
    email: "Email",
    message: "Message",
    placeholderName: "Your name",
    placeholderEmail: "you@email.com",
    placeholderMessage: "Optional message",
    requiredName: "Please enter your name.",
    invalidEmail: "Please enter a valid email address.",
    continueToPayment: "Confirm and continue",
    saving: "Saving…",
  },
  es: {
    title: "Checkout",
    subtitle: "Revisa tu selección e introduce tus datos.",
    backToCart: "← Volver al carrito",
    empty: "Tu carrito está vacío.",
    goToRegistry: "Ir a la lista",
    summary: "Resumen",
    totalItems: "Total de artículos",
    totalAmount: "Importe total",
    classicItems: "Artículos",
    contributionItems: "Contribuciones",
    itemAmount: "Importe",
    contribution: "Contribución",
    noImage: "Sin imagen",
    contactTitle: "Tus datos",
    name: "Nombre",
    email: "Correo electrónico",
    message: "Mensaje",
    placeholderName: "Tu nombre",
    placeholderEmail: "tu@email.com",
    placeholderMessage: "Mensaje opcional",
    requiredName: "Introduce tu nombre.",
    invalidEmail: "Introduce un correo electrónico válido.",
    continueToPayment: "Confirmar y continuar",
    saving: "Guardando…",
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = getSafeLang(params?.lang);
  const t = uiText[lang];

  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCart(readCart());
    setLoaded(true);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      window.alert(t.requiredName);
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      window.alert(t.invalidEmail);
      return;
    }

    if (cart.length === 0) {
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim() || null,
          cart,
          lang,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error ?? "Could not create checkout.");
      }

      if (!json?.redirectUrl) {
        throw new Error("Missing redirect URL.");
      }

      router.push(json.redirectUrl);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-[#f8f6f2] px-4 py-8 text-[#5e6a50]">
        …
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#f8f6f2]">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <button
            type="button"
            onClick={() => router.push(`/${lang}/cart`)}
            className="mb-6 text-sm text-[#5e6a50] transition hover:opacity-80"
          >
            {t.backToCart}
          </button>

          <div className="rounded-3xl border border-[#d8ddd1] bg-white p-6 shadow-sm">
            <div className="text-[#5e6a50]">{t.empty}</div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push(`/${lang}/registry`)}
                className="rounded-2xl bg-[#5e6a50] px-5 py-3 text-white transition hover:opacity-90"
              >
                {t.goToRegistry}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/cart`)}
          className="mb-6 text-sm text-[#5e6a50] transition hover:opacity-80"
        >
          {t.backToCart}
        </button>

        <div className="mb-6">
          <h1 className="text-3xl text-[#5e6a50]">{t.title}</h1>
          <p className="mt-2 text-[#7c8570]">{t.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm"
          >
            <h2 className="mb-5 text-xl text-[#5e6a50]">{t.contactTitle}</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-[#5e6a50]">{t.name}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.placeholderName}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#5e6a50]">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.placeholderEmail}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#5e6a50]">{t.message}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.placeholderMessage}
                  rows={5}
                  className="w-full rounded-2xl border border-[#d8ddd1] bg-white px-4 py-3 text-[#5e6a50] outline-none focus:border-[#5e6a50]"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className={[
                  "w-full rounded-2xl px-5 py-4 text-center transition",
                  submitting
                    ? "cursor-not-allowed bg-[#e8ebe3] text-[#9ba292]"
                    : "bg-[#5e6a50] text-white hover:opacity-90",
                ].join(" ")}
              >
                {submitting ? t.saving : t.continueToPayment}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
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
            </section>

            {classicItems.length > 0 ? (
              <section className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg text-[#5e6a50]">{t.classicItems}</h3>

                <div className="space-y-4">
                  {classicItems.map((line) => (
                    <div
                      key={`item-${line.itemId}`}
                      className="grid gap-4 rounded-2xl border border-[#e7eadf] bg-[#fcfbf8] p-4 sm:grid-cols-[72px_1fr]"
                    >
                      <div className="overflow-hidden rounded-xl bg-[#f3f1eb]">
                        {line.image_url ? (
                          <img
                            src={line.image_url}
                            alt={line.title}
                            className="h-[72px] w-[72px] object-cover"
                          />
                        ) : (
                          <div className="flex h-[72px] w-[72px] items-center justify-center text-center text-xs text-[#8d9484]">
                            {t.noImage}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-lg text-[#5e6a50]">{line.title}</div>
                        <div className="mt-2 text-sm text-[#7c8570]">
                          {t.itemAmount}: {euro(line.unit_cents, lang)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {contributionItems.length > 0 ? (
              <section className="rounded-3xl border border-[#d8ddd1] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg text-[#5e6a50]">{t.contributionItems}</h3>

                <div className="space-y-4">
                  {contributionItems.map((line) => (
                    <div
                      key={`contribution-${line.itemId}-${line.addedAt}`}
                      className="grid gap-4 rounded-2xl border border-[#e7eadf] bg-[#fcfbf8] p-4 sm:grid-cols-[72px_1fr]"
                    >
                      <div className="overflow-hidden rounded-xl bg-[#f3f1eb]">
                        {line.image_url ? (
                          <img
                            src={line.image_url}
                            alt={line.title}
                            className="h-[72px] w-[72px] object-cover"
                          />
                        ) : (
                          <div className="flex h-[72px] w-[72px] items-center justify-center text-center text-xs text-[#8d9484]">
                            {t.noImage}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-lg text-[#5e6a50]">{line.title}</div>
                        <div className="mt-2 text-sm text-[#7c8570]">
                          {t.contribution}: {euro(line.amount_cents, lang)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}