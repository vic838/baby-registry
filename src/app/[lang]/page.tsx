"use client";

import { useParams, useRouter } from "next/navigation";

type Lang = "nl" | "ca" | "en" | "es";

const text = {
  nl: {
    intro:
      "Wij zijn Mar & Vic. Na vele watertjes te hebben doorzwommen en omdat onze twee border collies wel een speelmaatje konden gebruiken, vonden we het tijd om aan ons eigen brouwsel te beginnen: Cleo.",
    story:
      "We zijn blij dat jullie de geboorte van onze dochter samen met ons willen vieren. Op deze geboortelijst hebben we cadeautjes verzameld die ons helpen om haar een warme start te geven. Elk cadeautje – groot of klein – maakt dit prille begin extra bijzonder.",
    thanks:
      "Dank jullie wel om ons verhaal mee zo mooi te maken.",
    registry: "Bekijk de geboortelijst",
    contribute: "Vrije bijdrage",
  },
  ca: {
    intro:
      "Som la Mar i en Vic. Després de moltes aventures i perquè els nostres dos border collies necessitaven companyia, vam decidir començar el nostre propi petit brouwsel: la Cleo.",
    story:
      "Estem molt contents que vulgueu celebrar amb nosaltres el naixement de la nostra filla. En aquesta llista hi trobareu regals que ens ajudaran a donar-li un inici càlid.",
    thanks:
      "Moltes gràcies per formar part d’aquest moment tan especial.",
    registry: "Veure la llista",
    contribute: "Contribució lliure",
  },
  en: {
    intro:
      "We are Mar & Vic. After quite a journey — and because our two border collies needed a new playmate — we decided it was time to start our own little brew: Cleo.",
    story:
      "We’re happy you want to celebrate the birth of our daughter with us. This registry gathers gifts that help us give her a warm start.",
    thanks:
      "Thank you for being part of this special moment.",
    registry: "View registry",
    contribute: "Free contribution",
  },
  es: {
    intro:
      "Somos Mar y Vic. Después de muchas aventuras y porque nuestros dos border collies necesitaban compañía, decidimos empezar nuestro propio pequeño brouwsel: Cleo.",
    story:
      "Estamos muy felices de que queráis celebrar con nosotros el nacimiento de nuestra hija.",
    thanks:
      "Gracias por formar parte de este momento tan especial.",
    registry: "Ver lista",
    contribute: "Contribución libre",
  },
};

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();

  const lang: Lang = ["nl", "ca", "en", "es"].includes(params.lang)
    ? (params.lang as Lang)
    : "nl";

  const t = text[lang];

  return (
    <main className="min-h-screen bg-[#f8f6f2] px-4 py-6">
      <div className="mx-auto max-w-2xl">

        {/* FOTO */}
        <div className="rounded-3xl overflow-hidden shadow-sm mb-6">
          <img
            src="/welcome-family.webp"
            alt="Mar Vic Cleo"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* TEKST */}
        <div className="text-center text-[#5e6a50]">
          <p className="text-lg leading-relaxed">{t.intro}</p>

          <p className="mt-4 text-sm leading-relaxed text-[#7c8570]">
            {t.story}
          </p>

          <p className="mt-3 text-sm text-[#7c8570]">{t.thanks}</p>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => router.push(`/${lang}/registry`)}
            className="rounded-2xl bg-[#5e6a50] py-4 text-white text-sm"
          >
            {t.registry}
          </button>

          <button
            onClick={() =>
              router.push(`/${lang}/item/diaper_contribution`)
            }
            className="rounded-2xl border border-[#cfd5c7] bg-white py-4 text-sm text-[#5e6a50]"
          >
            {t.contribute}
          </button>
        </div>
      </div>
    </main>
  );
}