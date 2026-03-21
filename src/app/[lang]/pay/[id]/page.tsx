"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { QrCode, Smartphone, Globe, CreditCard, Wallet } from "lucide-react";
import QRCode from "qrcode";

type ContributionStatus =
  | "PENDING"
  | "REPORTED"
  | "PAID"
  | "CANCELLED"
  | "FAILED";

type PayData = {
  contribution: {
    id: string;
    name: string;
    message: string | null;
    amount_cents: number;
    reference: string;
    status: ContributionStatus;
  };
  item: {
    id: string;
    title: string;
    slug: string | null;
  } | null;
};

type MethodKey = "payconiq" | "bizum" | "revolut" | "wero" | "sepa";

function euro(cents: number) {
  return new Intl.NumberFormat("nl-BE", {
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

export default function PayPage() {
  const router = useRouter();
  const params = useParams<{ lang: string; id: string }>();
  const searchParams = useSearchParams();

  const lang = params.lang ?? "nl";
  const id = params.id;
  const token = searchParams.get("t");

  const [data, setData] = useState<PayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [markingReported, setMarkingReported] = useState(false);
  const [sepaQrDataUrl, setSepaQrDataUrl] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const payconiqUrl = process.env.NEXT_PUBLIC_PAYCONIQ_MONEYPOT_URL ?? "";
  const bizumPhone = process.env.NEXT_PUBLIC_BIZUM_PHONE ?? "";
  const revolutUrl = process.env.NEXT_PUBLIC_REVOLUT_ME_URL ?? "";
  const weroPhone = process.env.NEXT_PUBLIC_WERO_PHONE ?? "";
  const iban = process.env.NEXT_PUBLIC_BANK_IBAN ?? "";
  const bic = process.env.NEXT_PUBLIC_BANK_BIC ?? "";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "";

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPayData() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/pay/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.error ?? "Bijdrage niet gevonden.");
        }

        if (!active) return;
        setData(json as PayData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Onbekende fout");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    loadPayData();

    return () => {
      active = false;
    };
  }, [id]);

  const contribution = data?.contribution ?? null;
  const item = data?.item ?? null;

  const amount = useMemo(
    () => (contribution ? euro(contribution.amount_cents) : ""),
    [contribution]
  );

  const sepaQrPayload = useMemo(() => {
    if (!contribution || !iban || !accountName) return null;

    return buildSepaQrPayload({
      bic,
      accountName,
      iban,
      amountCents: contribution.amount_cents,
      reference: contribution.reference,
    });
  }, [bic, accountName, iban, contribution]);

  const sepaPaymentLink = useMemo(() => {
    if (!contribution || !iban || !accountName) return null;

    return buildSepaPaymentLink({
      iban,
      amountCents: contribution.amount_cents,
      reference: contribution.reference,
      name: accountName,
    });
  }, [iban, accountName, contribution]);

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
          margin: 2,
          width: 280,
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
  }, [sepaQrPayload]);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} gekopieerd`);
      window.setTimeout(() => setToast(null), 1500);
    } catch {
      setToast("Kopiëren mislukt");
      window.setTimeout(() => setToast(null), 1500);
    }
  }

  async function markReported() {
    if (!contribution) return;

    if (
      contribution.status === "REPORTED" ||
      contribution.status === "PAID" ||
      contribution.status === "CANCELLED"
    ) {
      return;
    }

    const ok = window.confirm(
      "Heb je betaald? We registreren dit en bevestigen zodra de betaling binnen is."
    );
    if (!ok) return;

    try {
      setMarkingReported(true);

      if (!token) {
        throw new Error("Token ontbreekt.");
      }

      const res = await fetch(
        `/api/pay/${id}/report?t=${encodeURIComponent(token)}`,
        {
          method: "POST",
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error ?? "Kon niet opslaan.");
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              contribution: {
                ...prev.contribution,
                status: "REPORTED",
              },
            }
          : prev
      );

      setToast("Betaling als gemeld geregistreerd");
      window.setTimeout(() => setToast(null), 1800);
    } catch (err) {
      window.alert(
        "Kon niet opslaan: " +
          (err instanceof Error ? err.message : "onbekende fout")
      );
    } finally {
      setMarkingReported(false);
    }
  }

  const methods = useMemo(
    () =>
      [
        {
          key: "payconiq" as const,
          label: "Payconiq",
          enabled: payconiqUrl.trim() !== "",
          icon: <QrCode className="h-4 w-4" />,
        },
        {
          key: "bizum" as const,
          label: "Bizum",
          enabled: bizumPhone.trim() !== "",
          icon: <Smartphone className="h-4 w-4" />,
        },
        {
          key: "revolut" as const,
          label: "Revolut",
          enabled: revolutUrl.trim() !== "",
          icon: <Globe className="h-4 w-4" />,
        },
        {
          key: "wero" as const,
          label: "Wero",
          enabled: weroPhone.trim() !== "",
          icon: <Wallet className="h-4 w-4" />,
        },
        {
          key: "sepa" as const,
          label: "SEPA",
          enabled: iban.trim() !== "",
          icon: <CreditCard className="h-4 w-4" />,
        },
      ].filter((m) => m.enabled),
    [payconiqUrl, bizumPhone, revolutUrl, weroPhone, iban]
  );

  const [activeMethod, setActiveMethod] = useState<MethodKey>("sepa");

  useEffect(() => {
    if (methods.length === 0) return;
    if (!methods.some((m) => m.key === activeMethod)) {
      setActiveMethod(methods[0].key);
    }
  }, [methods, activeMethod]);

  function ActionButton({
    onClick,
    href,
    label,
  }: {
    onClick?: () => void;
    href?: string;
    label: string;
  }) {
    const cls =
      "min-w-[140px] rounded-xl bg-gray-900 px-4 py-2 text-center text-sm text-white disabled:opacity-60";

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
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
        onClick={() => copy(label, value)}
      >
        Kopieer
      </button>
    );
  }

  const statusBox = useMemo(() => {
    switch (contribution?.status) {
      case "PAID":
        return {
          cls: "bg-green-100 text-green-800",
          label: "Bevestigd betaald",
        };
      case "REPORTED":
        return {
          cls: "bg-amber-100 text-amber-800",
          label: "Betaling gemeld",
        };
      case "CANCELLED":
        return {
          cls: "bg-gray-100 text-gray-700",
          label: "Geannuleerd",
        };
      case "FAILED":
        return {
          cls: "bg-red-100 text-red-700",
          label: "Mislukt",
        };
      default:
        return {
          cls: "bg-blue-100 text-blue-800",
          label: "In afwachting",
        };
    }
  }, [contribution?.status]);

  const deviceHint = isMobile
    ? "Je gebruikt een smartphone. Open bij voorkeur rechtstreeks een betaalapp via de knoppen hieronder."
    : "Je gebruikt een computer. Scan de QR-code met je bankapp of gebruik een van de betaalopties hieronder.";

  if (loading) {
    return <main className="p-6">Laden…</main>;
  }

  if (error) {
    return <main className="p-6 text-red-600">{error}</main>;
  }

  if (!contribution) {
    return <main className="p-6">Bijdrage niet gevonden.</main>;
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2]">  
      <div className="mx-auto max-w-xl px-4 py-8">
        <button
          className="text-sm text-gray-600 hover:underline"
          onClick={() => router.push(`/${lang}/registry`)}
          type="button"
        >
          ← Terug naar lijst
        </button>

        <h1 className="mt-4 text-2xl font-semibold">Betaal je bijdrage</h1>

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
          <div className="text-sm text-gray-600">Naam</div>
          <div className="font-medium">{contribution.name}</div>

          <div className="mt-3 text-sm text-gray-600">Item</div>
          <div className="font-medium">{item?.title ?? "—"}</div>

          <div className="mt-3 text-sm text-gray-600">Bedrag</div>
          <div className="text-lg font-semibold">{amount}</div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-600">
              Referentie (zet dit in de mededeling)
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <code className="font-semibold">{contribution.reference}</code>
              <button
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={() => copy("Referentie", contribution.reference)}
                type="button"
              >
                Kopieer
              </button>
            </div>
          </div>

          {contribution.message ? (
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <div className="text-sm text-gray-600">Bericht</div>
              <div className="mt-1 text-sm text-gray-800">
                {contribution.message}
              </div>
            </div>
          ) : null}
        </div>

        {methods.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Er zijn nog geen betaalmethodes geconfigureerd. Voeg eerst je
            publieke betaalgegevens toe in de omgevingsvariabelen.
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-700">
              {deviceHint}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveMethod(m.key)}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-sm",
                    activeMethod === m.key
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700",
                  ].join(" ")}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border bg-gray-50 p-2">
                    {methods.find((m) => m.key === activeMethod)?.icon}
                  </div>
                  <h2 className="text-base font-semibold">
                    {methods.find((m) => m.key === activeMethod)?.label}
                  </h2>
                </div>

                {activeMethod === "payconiq" ? (
                  <ActionButton
                    href={payconiqUrl}
                    label={isMobile ? "Open Payconiq" : "Open"}
                  />
                ) : activeMethod === "bizum" ? (
                  <ActionButton
                    onClick={() => copy("Bizum nummer", bizumPhone)}
                    label="Kopieer"
                  />
                ) : activeMethod === "revolut" ? (
                  <ActionButton
                    href={revolutUrl}
                    label={isMobile ? "Open Revolut" : "Open"}
                  />
                ) : activeMethod === "wero" ? (
                  <ActionButton
                    onClick={() => copy("Wero nummer", weroPhone)}
                    label="Kopieer"
                  />
                ) : (
                  <ActionButton
                    onClick={() => copy("IBAN", iban)}
                    label={isMobile ? "Kopieer IBAN" : "Kopieer IBAN"}
                  />
                )}
              </div>

              <div className="mt-3 text-sm text-gray-600">
                {activeMethod === "payconiq" ? (
                  <>
                    Open de Payconiq-link en betaal <b>{amount}</b>. Zet de
                    referentie in de mededeling.
                  </>
                ) : activeMethod === "bizum" ? (
  <>
    {isMobile ? (
      <>
        Open Bizum in je bankapp en plak het nummer en de referentie hieronder.
        Controleer daarna nog even het bedrag voor je bevestigt.
      </>
    ) : (
      <>
        Open Bizum in je bankapp en gebruik het nummer, bedrag en de referentie
        hieronder om de betaling manueel uit te voeren.
      </>
    )}
  </>
                ) : activeMethod === "revolut" ? (
                  <>
                    Open de Revolut-link en stuur <b>{amount}</b>. Zet de
                    referentie in het bericht of de omschrijving indien
                    mogelijk.
                  </>
                ) : activeMethod === "wero" ? (
                  <>
                    Stuur <b>{amount}</b> via Wero naar <b>{weroPhone}</b> en
                    zet de referentie in het bericht of de omschrijving.
                  </>
                ) : isMobile ? (
                  <>
                    Open je bankapp via de knop hieronder of kopieer de
                    gegevens manueel. Controleer nog even bedrag en referentie
                    voor je bevestigt.
                  </>
                ) : (
                  <>
                    Scan de QR-code met je bankapp of gebruik de bankgegevens
                    hieronder. Controleer nog even bedrag en referentie voor je
                    bevestigt.
                  </>
                )}
              </div>

              {activeMethod === "bizum" ? (
  <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
    <div className="mb-3 text-sm text-gray-700">
      {isMobile
        ? "Open Bizum in je bankapp en plak nummer en referentie."
        : "Gebruik deze Bizum-gegevens in je bankapp om de betaling uit te voeren."}
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">Bizum nummer</span>
      <div className="flex items-center gap-2">
        <code className="font-semibold">{bizumPhone}</code>
        <CopyBtn label="Bizum nummer" value={bizumPhone} />
      </div>
    </div>

    <div className="mt-2 flex items-center justify-between gap-3">
      <span className="text-gray-600">Bedrag</span>
      <div className="flex items-center gap-2">
        <code className="font-semibold">{amount}</code>
        <CopyBtn label="Bedrag" value={amount} />
      </div>
    </div>

    <div className="mt-2 flex items-center justify-between gap-3">
      <span className="text-gray-600">Referentie</span>
      <div className="flex items-center gap-2">
        <code className="font-semibold">{contribution.reference}</code>
        <CopyBtn
          label="Referentie"
          value={contribution.reference}
        />
      </div>
    </div>
  </div>
) : null}

              {activeMethod === "wero" ? (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Wero nummer</span>
                    <div className="flex items-center gap-2">
                      <code className="font-semibold">{weroPhone}</code>
                      <CopyBtn label="Wero nummer" value={weroPhone} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-gray-600">Referentie</span>
                    <div className="flex items-center gap-2">
                      <code className="font-semibold">
                        {contribution.reference}
                      </code>
                      <CopyBtn
                        label="Referentie"
                        value={contribution.reference}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {activeMethod === "sepa" ? (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                  {sepaPaymentLink ? (
                    <div className="mb-4 flex justify-center">
                      <a
                        href={sepaPaymentLink}
                        className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white"
                      >
                        {isMobile ? "Open in bankapp" : "Open in bankapp"}
                      </a>
                    </div>
                  ) : null}

                  {!isMobile && sepaQrDataUrl ? (
                    <div className="mb-4 flex flex-col items-center">
                      <img
                        src={sepaQrDataUrl}
                        alt="SEPA QR-code"
                        className="h-56 w-56 rounded-xl border bg-white p-2"
                      />
                      <p className="mt-2 text-center text-xs text-gray-500">
                        Scan met je bankapp om IBAN, bedrag en referentie
                        automatisch over te nemen.
                      </p>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Rekeninghouder</span>
                    <span className="font-medium">{accountName || "—"}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-gray-600">IBAN</span>
                    <div className="flex items-center gap-2">
                      <code className="font-semibold">{iban}</code>
                      <CopyBtn label="IBAN" value={iban} />
                    </div>
                  </div>

                  {bic ? (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-gray-600">BIC</span>
                      <div className="flex items-center gap-2">
                        <code className="font-semibold">{bic}</code>
                        <CopyBtn label="BIC" value={bic} />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-gray-600">Referentie</span>
                    <div className="flex items-center gap-2">
                      <code className="font-semibold">
                        {contribution.reference}
                      </code>
                      <CopyBtn
                        label="Referentie"
                        value={contribution.reference}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          {contribution.status === "PENDING" ||
          contribution.status === "FAILED" ? (
            <>
              <h2 className="text-base font-semibold">Na betaling</h2>
              <p className="mt-2 text-sm text-gray-600">
                Klik op de knop zodra je betaald hebt. We controleren de
                ontvangst nadien manueel.
              </p>
              <button
                className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                type="button"
                onClick={markReported}
                disabled={markingReported}
              >
                {markingReported ? "Opslaan…" : "Ik heb betaald"}
              </button>
            </>
          ) : contribution.status === "REPORTED" ? (
            <>
              <h2 className="text-base font-semibold">Dankjewel! 🎉</h2>
              <p className="mt-2 text-sm text-gray-600">
                We hebben je betaling als <b>gemeld</b> genoteerd. Zodra we de
                betaling effectief zien binnenkomen, zetten we dit op{" "}
                <b>bevestigd</b>.
              </p>
            </>
          ) : contribution.status === "PAID" ? (
            <>
              <h2 className="text-base font-semibold">Dankjewel! 🎉</h2>
              <p className="mt-2 text-sm text-gray-600">
                Je bijdrage is <b>bevestigd ontvangen</b>. Bedankt voor je
                bijdrage aan de geboortelijst.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold">Status update</h2>
              <p className="mt-2 text-sm text-gray-600">
                Deze bijdrage is momenteel niet meer actief.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${lang}/registry`)}
            className="rounded-xl border px-4 py-3 text-sm"
          >
            Terug naar lijst
          </button>

          {item?.slug ? (
            <button
              type="button"
              onClick={() => router.push(`/${lang}/item/${item.slug}`)}
              className="rounded-xl border px-4 py-3 text-sm"
            >
              Terug naar item
            </button>
          ) : null}
        </div>

        {toast ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white">
            {toast}
          </div>
        ) : null}
      </div>
    </main>
  );
}