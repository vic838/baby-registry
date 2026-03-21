"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Smartphone, Globe, CreditCard, Wallet } from "lucide-react";
import QRCode from "qrcode";
import RegistryFaqSection from "../../../../../components/RegistryFaqSection";

type CheckoutStatus = "PENDING" | "REPORTED" | "PAID" | "CANCELLED" | "FAILED";
type MethodKey = "payconiq" | "revolut" | "wero" | "bank";
type Lang = "nl" | "ca" | "en" | "es";
type ViewMode = "mobile" | "desktop";

type PayCheckoutData = {
  checkout: {
    id: string;
    name: string;
    email: string;
    message: string | null;
    total_cents: number;
    reference: string;
    status: CheckoutStatus;
  };
  lines: {
    id: string;
    line_type: "item" | "contribution";
    item_id: string;
    title_snapshot: string;
    quantity: number;
    amount_cents: number;
  }[];
};

const uiText: Record<
  Lang,
  {
    backToList: string;
    title: string;
    name: string;
    email: string;
    totalAmount: string;
    reference: string;
    referenceHint: string;
    message: string;
    overview: string;
    item: string;
    contribution: string;
    methodsMissing: string;
    open: string;
    copy: string;
    copyIban: string;
    bizumNumber: string;
    weroNumber: string;
    accountHolder: string;
    iban: string;
    bic: string;
    address: string;
    afterPaymentTitle: string;
    afterPaymentText: string;
    reportedBtn: string;
    saving: string;
    thankYouTitle: string;
    thankYouReported: string;
    thankYouPaid: string;
    inactiveTitle: string;
    inactiveText: string;
    pending: string;
    reported: string;
    paid: string;
    cancelled: string;
    failed: string;
    copied: string;
    copyFailed: string;
    bankHint: string;
    payconiqHint: string;
    revolutHint: string;
    weroHint: string;
    scanHint: string;
    bankTransfer: string;
    openInBankApp: string;
  }
> = {
  nl: {
    backToList: "← Terug naar lijst",
    title: "Betaal je bestelling",
    name: "Naam",
    email: "E-mail",
    totalAmount: "Totaalbedrag",
    reference: "Referentie",
    referenceHint: "Zet dit in de mededeling",
    message: "Bericht",
    overview: "Overzicht",
    item: "Item",
    contribution: "Bijdrage",
    methodsMissing:
      "Er zijn nog geen betaalmethodes geconfigureerd. Voeg eerst je publieke betaalgegevens toe in de omgevingsvariabelen.",
    open: "Open",
    copy: "Kopieer",
    copyIban: "Kopieer IBAN",
    bizumNumber: "Bizum nummer",
    weroNumber: "Wero nummer",
    accountHolder: "Rekeninghouder",
    iban: "IBAN",
    bic: "BIC",
    address: "Adres",
    afterPaymentTitle: "Na betaling",
    afterPaymentText:
      "Klik op de knop zodra je betaald hebt. We controleren de ontvangst nadien manueel.",
    reportedBtn: "Ik heb betaald",
    saving: "Opslaan…",
    thankYouTitle: "Dankjewel! 🎉",
    thankYouReported:
      "We hebben je betaling als gemeld genoteerd. Zodra we de betaling effectief zien binnenkomen, zetten we dit op bevestigd.",
    thankYouPaid: "Je betaling is bevestigd ontvangen.",
    inactiveTitle: "Status update",
    inactiveText: "Deze checkout is momenteel niet meer actief.",
    pending: "In afwachting",
    reported: "Betaling gemeld",
    paid: "Bevestigd betaald",
    cancelled: "Geannuleerd",
    failed: "Mislukt",
    copied: "gekopieerd",
    copyFailed: "Kopiëren mislukt",
    bankHint:
      "Open in je bankapp of scan de QR-code. Controleer nadien nog even bedrag, referentie en rekeninggegevens voor je bevestigt.",
    payconiqHint:
      "Open Payconiq/Bancontact Pay en voer het bedrag van deze pagina in. Gebruik de referentie in de mededeling indien mogelijk.",
    revolutHint:
      "Open Revolut en stuur het totaalbedrag. Gebruik de referentie in het bericht of de omschrijving indien mogelijk.",
    weroHint:
      "Stuur het totaalbedrag via Wero en gebruik de referentie in het bericht of de omschrijving.",
    scanHint:
      "Scan met je bankapp om IBAN, bedrag en referentie automatisch over te nemen.",
    bankTransfer: "Bankoverschrijving",
    openInBankApp: "Open in bankapp",
  },
  ca: {
    backToList: "← Tornar a la llista",
    title: "Paga la teva comanda",
    name: "Nom",
    email: "Correu electrònic",
    totalAmount: "Import total",
    reference: "Referència",
    referenceHint: "Posa-ho a la comunicació",
    message: "Missatge",
    overview: "Resum",
    item: "Article",
    contribution: "Contribució",
    methodsMissing:
      "Encara no hi ha mètodes de pagament configurats. Afegeix primer les dades públiques de pagament a les variables d'entorn.",
    open: "Obrir",
    copy: "Copiar",
    copyIban: "Copiar IBAN",
    bizumNumber: "Número Bizum",
    weroNumber: "Número Wero",
    accountHolder: "Titular del compte",
    iban: "IBAN",
    bic: "BIC",
    address: "Adreça",
    afterPaymentTitle: "Després del pagament",
    afterPaymentText:
      "Fes clic al botó quan ja hagis pagat. Després comprovarem manualment la recepció.",
    reportedBtn: "Ja he pagat",
    saving: "Desant…",
    thankYouTitle: "Gràcies! 🎉",
    thankYouReported:
      "Hem registrat el teu pagament com a notificat. Quan el vegem efectivament rebut, el posarem com a confirmat.",
    thankYouPaid: "Hem confirmat la recepció del teu pagament.",
    inactiveTitle: "Actualització d'estat",
    inactiveText: "Aquest checkout ja no està actiu.",
    pending: "Pendent",
    reported: "Pagament notificat",
    paid: "Pagament confirmat",
    cancelled: "Cancel·lat",
    failed: "Fallit",
    copied: "copiat",
    copyFailed: "No s'ha pogut copiar",
    bankHint:
      "Obre-ho a l'app bancària o escaneja el QR. Després comprova l'import, la referència i les dades del compte abans de confirmar.",
    payconiqHint:
      "Obre Payconiq/Bancontact Pay i introdueix l'import d'aquesta pàgina. Afegeix la referència si és possible.",
    revolutHint:
      "Obre Revolut i envia l'import total. Afegeix la referència al missatge o descripció si és possible.",
    weroHint:
      "Envia l'import total amb Wero i afegeix la referència al missatge o descripció.",
    scanHint:
      "Escaneja amb l'app bancària per omplir automàticament IBAN, import i referència.",
    bankTransfer: "Transferència bancària",
    openInBankApp: "Obrir a l'app bancària",
  },
  en: {
    backToList: "← Back to list",
    title: "Pay your order",
    name: "Name",
    email: "Email",
    totalAmount: "Total amount",
    reference: "Reference",
    referenceHint: "Use this in the payment message",
    message: "Message",
    overview: "Overview",
    item: "Item",
    contribution: "Contribution",
    methodsMissing:
      "No payment methods are configured yet. First add your public payment details in the environment variables.",
    open: "Open",
    copy: "Copy",
    copyIban: "Copy IBAN",
    bizumNumber: "Bizum number",
    weroNumber: "Wero number",
    accountHolder: "Account holder",
    iban: "IBAN",
    bic: "BIC",
    address: "Address",
    afterPaymentTitle: "After payment",
    afterPaymentText:
      "Click the button once you have paid. We will manually verify the payment afterwards.",
    reportedBtn: "I have paid",
    saving: "Saving…",
    thankYouTitle: "Thank you! 🎉",
    thankYouReported:
      "We have registered your payment as reported. Once we actually see it arrive, we will mark it as confirmed.",
    thankYouPaid: "Your payment has been confirmed as received.",
    inactiveTitle: "Status update",
    inactiveText: "This checkout is currently no longer active.",
    pending: "Pending",
    reported: "Payment reported",
    paid: "Payment confirmed",
    cancelled: "Cancelled",
    failed: "Failed",
    copied: "copied",
    copyFailed: "Copy failed",
    bankHint:
      "Open in your banking app or scan the QR code. Then double-check the amount, reference and bank details before confirming.",
    payconiqHint:
      "Open Payconiq/Bancontact Pay and enter the amount shown on this page. Add the reference in the message if possible.",
    revolutHint:
      "Open Revolut and send the total amount. Add the reference in the message or description if possible.",
    weroHint:
      "Send the total amount through Wero and include the reference in the message or description.",
    scanHint:
      "Scan with your banking app to automatically import IBAN, amount and reference.",
    bankTransfer: "Bank transfer",
    openInBankApp: "Open in banking app",
  },
  es: {
    backToList: "← Volver a la lista",
    title: "Paga tu pedido",
    name: "Nombre",
    email: "Correo electrónico",
    totalAmount: "Importe total",
    reference: "Referencia",
    referenceHint: "Pon esto en el concepto",
    message: "Mensaje",
    overview: "Resumen",
    item: "Artículo",
    contribution: "Contribución",
    methodsMissing:
      "Todavía no hay métodos de pago configurados. Añade primero tus datos públicos de pago en las variables de entorno.",
    open: "Abrir",
    copy: "Copiar",
    copyIban: "Copiar IBAN",
    bizumNumber: "Número Bizum",
    weroNumber: "Número Wero",
    accountHolder: "Titular de la cuenta",
    iban: "IBAN",
    bic: "BIC",
    address: "Dirección",
    afterPaymentTitle: "Después del pago",
    afterPaymentText:
      "Haz clic en el botón cuando ya hayas pagado. Después comprobaremos manualmente la recepción.",
    reportedBtn: "Ya he pagado",
    saving: "Guardando…",
    thankYouTitle: "¡Gracias! 🎉",
    thankYouReported:
      "Hemos registrado tu pago como informado. Cuando lo veamos efectivamente recibido, lo marcaremos como confirmado.",
    thankYouPaid: "Tu pago ha sido confirmado como recibido.",
    inactiveTitle: "Actualización de estado",
    inactiveText: "Este checkout ya no está activo.",
    pending: "Pendiente",
    reported: "Pago informado",
    paid: "Pago confirmado",
    cancelled: "Cancelado",
    failed: "Fallido",
    copied: "copiado",
    copyFailed: "Error al copiar",
    bankHint:
      "Ábrelo en tu app bancaria o escanea el código QR. Luego comprueba el importe, la referencia y los datos bancarios antes de confirmar.",
    payconiqHint:
      "Abre Payconiq/Bancontact Pay e introduce el importe de esta página. Añade la referencia en el mensaje si es posible.",
    revolutHint:
      "Abre Revolut y envía el importe total. Añade la referencia en el mensaje o descripción si es posible.",
    weroHint:
      "Envía el importe total por Wero e incluye la referencia en el mensaje o descripción.",
    scanHint:
      "Escanea con tu app bancaria para importar automáticamente IBAN, importe y referencia.",
    bankTransfer: "Transferencia bancaria",
    openInBankApp: "Abrir en la app bancaria",
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

function amountForSepa(cents: number) {
  return `EUR${((cents || 0) / 100).toFixed(2)}`;
}

function buildSepaPaymentLink({
  iban,
  amountCents,
  reference,
  name,
}: {
  iban: string;
  amountCents: number;
  reference: string;
  name: string;
}) {
  const amount = ((amountCents || 0) / 100).toFixed(2);

  return `sepa://pay?iban=${encodeURIComponent(
    iban.replace(/\s+/g, "")
  )}&amount=${encodeURIComponent(amount)}&reference=${encodeURIComponent(
    reference
  )}&name=${encodeURIComponent(name)}`;
}

function buildSepaQrPayload({
  bic,
  accountName,
  iban,
  amountCents,
  reference,
}: {
  bic: string;
  accountName: string;
  iban: string;
  amountCents: number;
  reference: string;
}) {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    bic || "",
    accountName || "",
    iban.replace(/\s+/g, ""),
    amountForSepa(amountCents),
    "",
    reference || "",
    "",
  ].join("\n");
}

export default function PayCheckoutPage() {
  const router = useRouter();
  const params = useParams<{ lang: string; id: string }>();
  const searchParams = useSearchParams();

  const lang = getSafeLang(params?.lang);
  const t = uiText[lang];
  const id = params?.id;
  const token = searchParams.get("t");

  const [data, setData] = useState<PayCheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [markingReported, setMarkingReported] = useState(false);
  const [sepaQrDataUrl, setSepaQrDataUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  const payconiqUrl = process.env.NEXT_PUBLIC_PAYCONIQ_MONEYPOT_URL ?? "";
  const revolutUrl = process.env.NEXT_PUBLIC_REVOLUT_ME_URL ?? "";
  const weroPhone = process.env.NEXT_PUBLIC_WERO_PHONE ?? "";
  const iban = process.env.NEXT_PUBLIC_BANK_IBAN ?? "";
  const bic = process.env.NEXT_PUBLIC_BANK_BIC ?? "";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "";
  const bankAddressLine1 = process.env.NEXT_PUBLIC_BANK_ADDRESS_LINE_1 ?? "";
  const bankAddressLine2 = process.env.NEXT_PUBLIC_BANK_ADDRESS_LINE_2 ?? "";
  const bankAddressLine3 = process.env.NEXT_PUBLIC_BANK_ADDRESS_LINE_3 ?? "";

  const addressLines = [
    bankAddressLine1.trim(),
    bankAddressLine2.trim(),
    bankAddressLine3.trim(),
  ].filter(Boolean);

  const isMobile = viewMode === "mobile";
  const qrSize = isMobile ? 184 : 280;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");

    const updateViewMode = () => {
      setViewMode(mediaQuery.matches ? "mobile" : "desktop");
    };

    updateViewMode();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewMode);
      window.addEventListener("resize", updateViewMode);

      return () => {
        mediaQuery.removeEventListener("change", updateViewMode);
        window.removeEventListener("resize", updateViewMode);
      };
    }

    mediaQuery.addListener(updateViewMode);
    window.addEventListener("resize", updateViewMode);

    return () => {
      mediaQuery.removeListener(updateViewMode);
      window.removeEventListener("resize", updateViewMode);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPayData() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/pay/checkout/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.error ?? "Checkout not found.");
        }

        if (!active) return;
        setData(json as PayCheckoutData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    if (id) {
      loadPayData();
    } else {
      setError("Missing checkout id.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  const checkout = data?.checkout ?? null;
  const lines = data?.lines ?? [];

  const totalLabel = useMemo(
    () => (checkout ? euro(checkout.total_cents, lang) : ""),
    [checkout, lang]
  );

  const sepaQrPayload = useMemo(() => {
    if (!checkout || !iban || !accountName) return null;

    return buildSepaQrPayload({
      bic,
      accountName,
      iban,
      amountCents: checkout.total_cents,
      reference: checkout.reference,
    });
  }, [bic, accountName, iban, checkout]);

  const sepaPaymentLink = useMemo(() => {
    if (!checkout || !iban || !accountName) return null;

    return buildSepaPaymentLink({
      iban,
      amountCents: checkout.total_cents,
      reference: checkout.reference,
      name: accountName,
    });
  }, [iban, accountName, checkout]);

  useEffect(() => {
    let active = true;

    async function generateQr() {
      if (!sepaQrPayload) {
        setSepaQrDataUrl(null);
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(sepaQrPayload, {
          errorCorrectionLevel: "M",
          margin: isMobile ? 1 : 2,
          width: qrSize,
        });

        if (!active) return;
        setSepaQrDataUrl(dataUrl);
      } catch {
        if (!active) return;
        setSepaQrDataUrl(null);
      }
    }

    generateQr();

    return () => {
      active = false;
    };
  }, [sepaQrPayload, isMobile, qrSize]);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} ${t.copied}`);
      window.setTimeout(() => setToast(null), 1500);
    } catch {
      setToast(t.copyFailed);
      window.setTimeout(() => setToast(null), 1500);
    }
  }

  async function markReported() {
    if (!checkout || !id) return;

    if (
      checkout.status === "REPORTED" ||
      checkout.status === "PAID" ||
      checkout.status === "CANCELLED"
    ) {
      return;
    }

    const ok = window.confirm(
      lang === "nl"
        ? "Heb je betaald? We registreren dit en bevestigen zodra de betaling binnen is."
        : lang === "ca"
        ? "Ja has pagat? Ho registrarem i ho confirmarem quan el pagament arribi."
        : lang === "es"
        ? "¿Ya has pagado? Lo registraremos y lo confirmaremos en cuanto llegue el pago."
        : "Have you paid? We will register it and confirm it once the payment arrives."
    );
    if (!ok) return;

    try {
      setMarkingReported(true);

      if (!token) {
        throw new Error("Token ontbreekt.");
      }

      const res = await fetch(
        `/api/pay/checkout/${id}/report?t=${encodeURIComponent(token)}`,
        {
          method: "POST",
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error ?? "Could not save.");
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              checkout: {
                ...prev.checkout,
                status: "REPORTED",
              },
            }
          : prev
      );

      setToast(
        lang === "nl"
          ? "Betaling als gemeld geregistreerd"
          : lang === "ca"
          ? "Pagament registrat com a notificat"
          : lang === "es"
          ? "Pago registrado como informado"
          : "Payment registered as reported"
      );

      window.setTimeout(() => {
        router.push(`/${lang}/thank-you?id=${id}`);
      }, 800);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setMarkingReported(false);
    }
  }

  const methods = useMemo(
    () =>
      [
        {
          key: "payconiq" as const,
          label: "Payconiq / Bancontact Pay",
          enabled: !!payconiqUrl,
          icon: <Smartphone className="h-4 w-4" />,
        },
        {
          key: "revolut" as const,
          label: "Revolut",
          enabled: !!revolutUrl,
          icon: <Globe className="h-4 w-4" />,
        },
        {
          key: "wero" as const,
          label: "Wero",
          enabled: !!weroPhone,
          icon: <Wallet className="h-4 w-4" />,
        },
        {
          key: "bank" as const,
          label: t.bankTransfer,
          enabled: !!iban,
          icon: <CreditCard className="h-4 w-4" />,
        },
      ].filter((m) => m.enabled),
    [payconiqUrl, revolutUrl, weroPhone, iban, t.bankTransfer]
  );

  const [activeMethod, setActiveMethod] = useState<MethodKey>("bank");

  useEffect(() => {
    if (methods.length === 0) return;
    if (!methods.some((m) => m.key === activeMethod)) {
      setActiveMethod(methods[0].key);
    }
  }, [methods, activeMethod]);

  const statusBox = useMemo(() => {
    switch (checkout?.status) {
      case "PAID":
        return { cls: "bg-green-100 text-green-800", label: t.paid };
      case "REPORTED":
        return { cls: "bg-amber-100 text-amber-800", label: t.reported };
      case "CANCELLED":
        return { cls: "bg-gray-100 text-gray-700", label: t.cancelled };
      case "FAILED":
        return { cls: "bg-red-100 text-red-700", label: t.failed };
      default:
        return { cls: "bg-blue-100 text-blue-800", label: t.pending };
    }
  }, [checkout?.status, t]);

  function ActionButton({
    onClick,
    href,
    label,
  }: {
    onClick?: () => void;
    href?: string;
    label: string;
  }) {
    const cls = [
      "inline-flex items-center justify-center rounded-xl bg-gray-900 text-center text-white disabled:opacity-60",
      isMobile
        ? "min-h-[52px] w-full px-5 text-base font-medium"
        : "min-w-[110px] px-4 py-2 text-sm",
    ].join(" ");

    if (href) {
      return (
        <a className={cls} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      );
    }

    return (
      <button className={cls} onClick={onClick} type="button">
        {label}
      </button>
    );
  }

  function CopyBtn({ label, value }: { label: string; value: string }) {
    return (
      <button
        type="button"
        className={[
          "rounded-lg border border-gray-300",
          isMobile
            ? "min-h-[40px] px-3 py-2 text-sm"
            : "px-2 py-1 text-xs",
        ].join(" ")}
        onClick={() => copy(label, value)}
      >
        {t.copy}
      </button>
    );
  }

  if (loading) {
    return <main className="p-6">Laden…</main>;
  }

  if (error) {
    return <main className="p-6 text-red-600">{error}</main>;
  }

  if (!checkout) {
    return <main className="p-6">Checkout not found.</main>;
  }

  return (
    <main className="min-h-screen bg-white" data-view-mode={viewMode}>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <button
          className="text-sm text-gray-600 hover:underline"
          onClick={() => router.push(`/${lang}/registry`)}
          type="button"
        >
          {t.backToList}
        </button>

        <h1 className="mt-4 text-2xl font-semibold">{t.title}</h1>

        <div className="mt-3">
          <span
            className={[
              "inline-flex rounded-full px-3 py-1 text-xs font-medium",
              statusBox.cls,
            ].join(" ")}
          >
            {statusBox.label}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-600">{t.name}</div>
          <div className="font-medium">{checkout.name}</div>

          <div className="mt-3 text-sm text-gray-600">{t.email}</div>
          <div className="font-medium break-all">{checkout.email}</div>

          <div className="mt-3 text-sm text-gray-600">{t.totalAmount}</div>
          <div className="text-lg font-semibold">{totalLabel}</div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-600">
              {t.reference} ({t.referenceHint})
            </div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <code className="font-semibold break-all">{checkout.reference}</code>
              <button
                className={[
                  "rounded-xl border",
                  isMobile
                    ? "min-h-[44px] w-full px-4 py-2 text-sm font-medium sm:w-auto"
                    : "px-3 py-2 text-sm",
                ].join(" ")}
                onClick={() => copy(t.reference, checkout.reference)}
                type="button"
              >
                {t.copy}
              </button>
            </div>
          </div>

          {checkout.message ? (
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <div className="text-sm text-gray-600">{t.message}</div>
              <div className="mt-1 text-sm text-gray-800">{checkout.message}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t.overview}</h2>

          <div className="mt-4 space-y-3">
            {lines.map((line) => (
              <div
                key={line.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="font-medium">{line.title_snapshot}</div>
                  <div className="text-sm text-gray-600">
                    {line.line_type === "item" ? t.item : t.contribution}
                  </div>
                </div>
                <div className="shrink-0 font-medium">
                  {euro(line.amount_cents, lang)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {methods.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            {t.methodsMissing}
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveMethod(m.key)}
                  className={[
                    "flex items-center justify-center gap-2 rounded-full border text-sm",
                    isMobile ? "min-h-[48px] px-4 py-3 font-medium" : "px-3 py-2",
                    activeMethod === m.key
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700",
                  ].join(" ")}
                >
                  {m.icon}
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border bg-gray-50 p-2">
                    {methods.find((m) => m.key === activeMethod)?.icon}
                  </div>
                  <h2 className="text-base font-semibold">
                    {methods.find((m) => m.key === activeMethod)?.label}
                  </h2>
                </div>

                <div className={isMobile ? "w-full sm:w-auto" : ""}>
                  {activeMethod === "payconiq" ? (
                    <ActionButton href={payconiqUrl} label={t.open} />
                  ) : activeMethod === "revolut" ? (
                    <ActionButton href={revolutUrl} label={t.open} />
                  ) : activeMethod === "wero" ? (
                    <ActionButton
                      onClick={() => copy(t.weroNumber, weroPhone)}
                      label={t.copy}
                    />
                  ) : (
                    <ActionButton
                      onClick={() => copy(t.iban, iban)}
                      label={t.copyIban}
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                {activeMethod === "payconiq"
                  ? t.payconiqHint
                  : activeMethod === "revolut"
                  ? t.revolutHint
                  : activeMethod === "wero"
                  ? t.weroHint
                  : t.bankHint}
              </div>

              {activeMethod === "wero" ? (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">{t.weroNumber}</span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="font-semibold break-all">{weroPhone}</code>
                      <CopyBtn label={t.weroNumber} value={weroPhone} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">{t.reference}</span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="font-semibold break-all">{checkout.reference}</code>
                      <CopyBtn label={t.reference} value={checkout.reference} />
                    </div>
                  </div>
                </div>
              ) : null}

              {activeMethod === "bank" ? (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                  {sepaPaymentLink ? (
                    <div className="mb-4 flex justify-center">
                      <a
                        href={sepaPaymentLink}
                        className={[
                          "inline-flex items-center justify-center rounded-xl bg-green-600 font-medium text-white",
                          isMobile
                            ? "min-h-[52px] w-full px-5 text-base sm:w-auto"
                            : "px-4 py-3 text-sm",
                        ].join(" ")}
                      >
                        {t.openInBankApp}
                      </a>
                    </div>
                  ) : null}

                  {sepaQrDataUrl ? (
                    <div className="mb-4 flex flex-col items-center">
                      <img
                        src={sepaQrDataUrl}
                        alt="SEPA QR-code"
                        className="rounded-xl border bg-white p-2"
                        style={{ width: qrSize, height: qrSize }}
                      />
                      <p className="mt-2 max-w-xs text-center text-xs text-gray-500">
                        {t.scanHint}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">{t.accountHolder}</span>
                    <span className="font-medium">{accountName || "—"}</span>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">{t.iban}</span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="font-semibold break-all">{iban}</code>
                      <CopyBtn label={t.iban} value={iban} />
                    </div>
                  </div>

                  {bic ? (
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-gray-600">{t.bic}</span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <code className="font-semibold break-all">{bic}</code>
                        <CopyBtn label={t.bic} value={bic} />
                      </div>
                    </div>
                  ) : null}

                  {addressLines.length > 0 ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <span className="text-gray-600">{t.address}</span>
                      <div className="text-left sm:text-right">
                        {addressLines.map((line, index) => (
                          <div key={index} className="font-medium">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">{t.reference}</span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="font-semibold break-all">{checkout.reference}</code>
                      <CopyBtn label={t.reference} value={checkout.reference} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          {checkout.status === "PENDING" || checkout.status === "FAILED" ? (
            <>
              <h2 className="text-base font-semibold">{t.afterPaymentTitle}</h2>
              <p className="mt-2 text-sm text-gray-600">{t.afterPaymentText}</p>
              <button
                className={[
                  "mt-3 w-full rounded-xl bg-green-600 font-medium text-white disabled:opacity-60",
                  isMobile ? "min-h-[54px] px-5 py-3 text-base" : "px-4 py-3 text-sm",
                ].join(" ")}
                type="button"
                onClick={markReported}
                disabled={markingReported}
              >
                {markingReported ? t.saving : t.reportedBtn}
              </button>
            </>
          ) : checkout.status === "REPORTED" ? (
            <>
              <h2 className="text-base font-semibold">{t.thankYouTitle}</h2>
              <p className="mt-2 text-sm text-gray-600">{t.thankYouReported}</p>
            </>
          ) : checkout.status === "PAID" ? (
            <>
              <h2 className="text-base font-semibold">{t.thankYouTitle}</h2>
              <p className="mt-2 text-sm text-gray-600">{t.thankYouPaid}</p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold">{t.inactiveTitle}</h2>
              <p className="mt-2 text-sm text-gray-600">{t.inactiveText}</p>
            </>
          )}
        </div>

        {toast ? (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        ) : null}

        <div className="mt-10"> <RegistryFaqSection lang={lang} compact variant="checkout" />
</div>
      </div>
    </main>
  );
}