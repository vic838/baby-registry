"use client";

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
  }
> = {
  nl: {
    title: "Dankjewel! 🎉",
    intro: "Je betaling werd gestart of als gemeld geregistreerd.",
    subtext:
      "Zodra de betaling effectief ontvangen is, wordt deze manueel bevestigd.",
    checkoutLabel: "Checkout",
    backToList: "Terug naar lijst",
    home: "Home",
  },
  ca: {
    title: "Gràcies! 🎉",
    intro: "El teu pagament s'ha iniciat o s'ha registrat com a notificat.",
    subtext:
      "Quan el pagament s'hagi rebut efectivament, es confirmarà manualment.",
    checkoutLabel: "Checkout",
    backToList: "Tornar a la llista",
    home: "Inici",
  },
  en: {
    title: "Thank you! 🎉",
    intro: "Your payment was started or registered as reported.",
    subtext:
      "Once the payment is actually received, it will be manually confirmed.",
    checkoutLabel: "Checkout",
    backToList: "Back to list",
    home: "Home",
  },
  es: {
    title: "¡Gracias! 🎉",
    intro: "Tu pago se ha iniciado o se ha registrado como informado.",
    subtext:
      "Cuando el pago se reciba efectivamente, se confirmará manualmente.",
    checkoutLabel: "Checkout",
    backToList: "Volver a la lista",
    home: "Inicio",
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

  const lang = getSafeLang(params?.lang);
  const t = uiText[lang];
  const id = searchParams.get("id");

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-xl px-4 py-12 text-center sm:py-16">
        <h1 className="text-3xl font-semibold text-[#5e6a50]">{t.title}</h1>

        <p className="mt-4 text-base text-[#7c8570]">{t.intro}</p>

        <p className="mt-2 text-sm text-[#7c8570]">{t.subtext}</p>

        {id ? (
          <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-xs text-[#a0a69a] shadow-sm">
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
    </main>
  );
}