"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Lang = "nl" | "ca" | "en" | "es";

const text: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    registry: string;
    continue: string;
  }
> = {
  nl: {
    title: "Welkom bij de geboortelijst van Cleo",
    subtitle: "Kies een cadeautje voor Cleo.",
    registry: "Bekijk de geboortelijst",
    continue: "Continue",
  },
  ca: {
    title: "Benvinguts a la llista de naixement de la Cleo",
    subtitle: "Tria un regalet per a la Cleo.",
    registry: "Veure la llista",
    continue: "Continue",
  },
  en: {
    title: "Welcome to Cleo’s baby registry",
    subtitle: "Choose a gift for Cleo.",
    registry: "View registry",
    continue: "Continue",
  },
  es: {
    title: "Bienvenidos a la lista de nacimiento de Cleo",
    subtitle: "Elige un regalito para Cleo.",
    registry: "Ver la lista",
    continue: "Continue",
  },
};

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const [showContent, setShowContent] = useState(false);

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
            showContent ? "-translate-y-[52vh]" : "translate-y-0",
          ].join(" ")}
        >
          <section className="relative h-screen overflow-hidden">
            <img
              src="/welcome-family.webp"
              alt="Mar Vic Cleo"
             
             className="
  absolute inset-0 h-full w-full
  object-cover
  object-[60%_40%]
  scale-[0.92] md:scale-100
"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />

            <div className="relative flex min-h-screen flex-col justify-end px-4 pb-8 sm:px-6">
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowContent(true)}
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
            showContent ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div className="rounded-3xl bg-white/85 p-5 text-center shadow-sm backdrop-blur-sm">
            <h1 className="text-2xl font-semibold leading-tight text-[#5e6a50]">
              {t.title}
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#7c8570]">{t.subtitle}</p>

            <div className="mt-8">
              <button
                onClick={() => router.push(`/${lang}/registry`)}
                className="min-h-[52px] w-full rounded-2xl bg-[#5e6a50] px-5 py-3 text-base font-medium text-white"
                type="button"
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