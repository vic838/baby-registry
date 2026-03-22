"use client";

import { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import RegistryFaqSection from "../../../components/RegistryFaqSection";

type Lang = "nl" | "ca" | "en" | "es";

const uiText: Record<
  Lang,
  {
    title: string;
    intro: string;
    subtext: string;
    checkoutLabel: string;
    backToList: string;
    home: string;
    continue: string;
  }
> = {
  nl: {
    title: "Dankjewel! 🎉",
    intro: "Je betaling werd gestart of als gemeld geregistreerd.",
    subtext:
      "Zodra de betaling effectief ontvangen is, wordt deze manueel bevestigd. Dank je wel voor je bijdrage en om dit bijzondere moment met ons te delen. We kijken ernaar uit om je binnenkort aan Cleo voor te stellen.",
    checkoutLabel: "Checkout",
    backToList: "Terug naar geboortelijst",
    home: "Home",
    continue: "Continue",
  },
  ca: {
    title: "Gràcies! 🎉",
    intro: "El teu pagament s'ha iniciat o s'ha registrat com a notificat.",
    subtext:
      "Quan el pagament s'hagi rebut efectivament, es confirmarà manualment. Gràcies per la teva contribució i per compartir aquest moment tan especial amb nosaltres. Tenim moltes ganes de presentar-te ben aviat la Cleo.",
    checkoutLabel: "Checkout",
    backToList: "Tornar a la llista de naixement",
    home: "Inici",
    continue: "Continue",
  },
  en: {
    title: "Thank you! 🎉",
    intro: "Your payment was started or registered as reported.",
    subtext:
      "Once the payment is actually received, it will be manually confirmed. Thank you for your contribution and for sharing this special moment with us. We look forward to introducing Cleo to you soon.",
    checkoutLabel: "Checkout",
    backToList: "Back to registry",
    home: "Home",
    continue: "Continue",
  },
  es: {
    title: "¡Gracias! 🎉",
    intro: "Tu pago se ha iniciado o se ha registrado como informado.",
    subtext:
      "Cuando el pago se reciba efectivamente, se confirmará manualmente. Gracias por tu contribución y por compartir con nosotros este momento tan especial. Tenemos muchas ganas de presentarte pronto a Cleo.",
    checkoutLabel: "Checkout",
    backToList: "Volver a la lista de nacimiento",
    home: "Inicio",
    continue: "Continue",
  },
};

function getSafeLang(value?: string): Lang {
  if (value === "nl" || value === "ca" || value === "en" || value === "es") {
    return value;
  }
  return "nl";
}

export default function ThankYouPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const [showContent, setShowContent] = useState(false);

  const lang = getSafeLang(params?.lang);
  const t = uiText[lang];
  const id = searchParams.get("id");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f6f2]">
      <div className="relative mx-auto min-h-screen w-full max-w-md">
        {/* HERO */}
        <div
          className={[
            "absolute inset-x-0 top-0 z-10 transition-transform duration-700 ease-in-out",
            showContent ? "-translate-y-[72vh]" : "translate-y-0",
          ].join(" ")}
        >
          <section className="relative h-[58vh] overflow-hidden bg-[#f8f6f2]">
            <img
              src="/thx.webp"
              alt="Thank you"
              className="absolute inset-0 h-full w-full object-contain"
            />

            <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShowContent(true)}
                aria-label={t.continue}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#d8ddd1] bg-white/95 text-3xl text-[#5e6a50] shadow-lg backdrop-blur transition hover:bg-white active:scale-95"
              >
                ↓
              </button>

              <div className="text-xs tracking-wide text-[#5e6a50]">
                {t.continue}
              </div>
            </div>
          </section>
        </div>

        {/* CONTENT */}
        <div
          className={[
            "relative z-0 min-h-screen px-4 pb-8 pt-[54vh] sm:px-6",
            "transition-opacity duration-500",
            showContent ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div className="rounded-3xl bg-white/90 p-5 text-center shadow-sm backdrop-blur-sm">
            <h1 className="text-3xl font-semibold text-[#5e6a50]">{t.title}</h1>

            <p className="mt-4 text-base text-[#7c8570]">{t.intro}</p>

            <p className="mt-3 text-sm leading-7 text-[#7c8570]">{t.subtext}</p>

            {id ? (
              <div className="mt-6 inline-flex max-w-full rounded-full bg-[#f8f6f2] px-4 py-2 text-xs text-[#a0a69a] shadow-sm break-all">
                {t.checkoutLabel}: {id}
              </div>
            ) : null}

            <div className="mt-10 space-y-3">
              <button
                onClick={() => router.push(`/${lang}/registry`)}
                className="min-h-[52px] w-full rounded-2xl bg-[#5e6a50] px-5 py-3 text-base font-medium text-white"
                type="button"
              >
                {t.backToList}
              </button>

              <button
                onClick={() => router.push(`/`)}
                className="min-h-[52px] w-full rounded-2xl border border-[#d8ddd1] bg-white px-5 py-3 text-base font-medium text-[#5e6a50]"
                type="button"
              >
                {t.home}
              </button>
            </div>
          </div>

          <div className="mt-10">
            <RegistryFaqSection lang={lang} compact />
          </div>
        </div>
      </div>
    </main>
  );
}