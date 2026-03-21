"use client";

import { useParams, useRouter } from "next/navigation";
import RegistryFaqSection from "../../../components/RegistryFaqSection";

type Lang = "nl" | "ca" | "en" | "es";

function getSafeLang(value?: string): Lang {
  if (value === "nl" || value === "ca" || value === "en" || value === "es") {
    return value;
  }
  return "nl";
}

const pageText: Record<
  Lang,
  { backToRegistry: string; title: string; intro: string }
> = {
  nl: {
    backToRegistry: "← Terug naar lijst",
    title: "Veelgestelde vragen",
    intro:
      "Hier vind je de meest praktische info over de geboortelijst en het betalen.",
  },
  ca: {
    backToRegistry: "← Tornar a la llista",
    title: "Preguntes freqüents",
    intro:
      "Aquí trobaràs la informació més pràctica sobre la llista de naixement i el pagament.",
  },
  en: {
    backToRegistry: "← Back to list",
    title: "Frequently asked questions",
    intro:
      "Here you’ll find the most practical information about the registry and payments.",
  },
  es: {
    backToRegistry: "← Volver a la lista",
    title: "Preguntas frecuentes",
    intro:
      "Aquí encontrarás la información más práctica sobre la lista de nacimiento y el pago.",
  },
};

export default function FaqPage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const lang = getSafeLang(params?.lang);
  const t = pageText[lang];

  return (
    <main className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/registry`)}
          className="text-sm text-[#5e6a50] hover:underline"
        >
          {t.backToRegistry}
        </button>

        <h1 className="mt-4 text-3xl font-semibold text-[#5e6a50]">
          {t.title}
        </h1>

        <p className="mt-3 text-sm text-[#7c8570] sm:text-base">{t.intro}</p>

        <RegistryFaqSection lang={lang} compact={false} />
      </div>
    </main>
  );
}