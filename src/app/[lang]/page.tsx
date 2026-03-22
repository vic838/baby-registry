"use client";

import { useState } from "react";
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
    continue: "Continue",
  },
  ca: {
    intro:
      "Som la Mar i en Vic. Després de moltes aventures i perquè els nostres dos border collies necessitaven companyia, vam decidir començar el nostre propi petit brouwsel: la Cleo.",
    story:
      "Estem molt contents que vulgueu celebrar amb nosaltres el naixement de la nostra filla. En aquesta llista hi trobareu regals que ens ajudaran a donar-li un inici càlid.",
    thanks:
      "Moltes gràcies per formar part d’aquest moment tan especial.",
    registry: "Veure la llista",
    continue: "Continue",
  },
  en: {
    intro:
      "We are Mar & Vic. After quite a journey — and because our two border collies needed a new playmate — we decided it was time to start our own little brew: Cleo.",
    story:
      "We’re happy you want to celebrate the birth of our daughter with us. This registry gathers gifts that help us give her a warm start.",
    thanks:
      "Thank you for being part of this special moment.",
    registry: "View registry",
    continue: "Continue",
  },
  es: {
    intro:
      "Somos Mar y Vic. Después de muchas aventuras y porque nuestros dos border collies necesitaban compañía, decidimos empezar nuestro propio pequeño brouwsel: Cleo.",
    story:
      "Estamos muy felices de que queráis celebrar con nosotros el nacimiento de nuestra hija.",
    thanks:
      "Gracias por formar parte de este momento tan especial.",
    registry: "Ver lista",
    continue: "Continue",
  },
};

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const [showText, setShowText] = useState(false);

  const lang: Lang = ["nl", "ca", "en", "es"].includes(params.lang)
    ? (params.lang as Lang)
    : "nl";

  const t = text[lang];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f6f2]">
      <div className="relative mx-auto min-h-screen w-full max-w-md">
        <div
          className={[
            "absolute inset-0 z-10 transition-transform duration-700 ease-in-out",
            showText ? "-translate-y-[52vh]" : "translate-y-0",
          ].join(" ")}
        >
          <section className="relative h-screen overflow-hidden">
            <img
              src="/welcome-family.webp"
              alt="Mar Vic Cleo"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />

            <div className="relative flex min-h-screen flex-col justify-end px-4 pb-8 sm:px-6">
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowText(true)}
                    aria-label={t.continue}
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/95 text-3xl text-[#5e6a50] shadow-lg backdrop-blur transition hover:bg-white active:scale-95"
                  >
                    ↓
                  </button>

                  <div className="text-xs tracking-wide text-white/95">
                    {t.continue}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div
          className={[
            "relative z-0 flex min-h-screen flex-col justify-end px-4 pb-8 pt-24 sm:px-6",
            "transition-opacity duration-500",
            showText ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div className="rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <div className="text-center text-[#5e6a50]">
              <p className="text-lg leading-relaxed">{t.intro}</p>

              <p className="mt-4 text-sm leading-relaxed text-[#7c8570]">
                {t.story}
              </p>

              <p className="mt-3 text-sm text-[#7c8570]">{t.thanks}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => router.push(`/${lang}/registry`)}
                className="rounded-2xl bg-[#5e6a50] py-4 text-sm text-white"
              >
                {t.registry}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}