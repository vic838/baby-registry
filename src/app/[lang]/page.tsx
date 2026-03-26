"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { welcomeCopy } from "@/content/welcomeCopy";

type Lang = "nl" | "ca" | "en" | "es";

const uiText: Record<
  Lang,
  {
    registry: string;
    continue: string;
  }
> = {
  nl: {
    registry: "Bekijk de geboortelijst",
    continue: "Verder",
  },
  ca: {
    registry: "Veure la llista",
    continue: "Continua",
  },
  en: {
    registry: "View registry",
    continue: "Continue",
  },
  es: {
    registry: "Ver la lista",
    continue: "Continuar",
  },
};

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const [showContent, setShowContent] = useState(false);

  const lang: Lang = ["nl", "ca", "en", "es"].includes(params.lang)
    ? (params.lang as Lang)
    : "nl";

  const t = uiText[lang];
  const copy = welcomeCopy[lang] ?? welcomeCopy.en;

  return (
    <main className="min-h-[100svh] overflow-hidden bg-[#f8f6f2]">
      <div className="relative min-h-[100svh] w-full">
        <div
          className={[
            "absolute inset-0 z-10 transition-transform duration-700 ease-in-out will-change-transform",
            showContent ? "-translate-y-[52svh]" : "translate-y-0",
          ].join(" ")}
        >
          <section className="relative h-[100svh] overflow-hidden">
            <Image
              src="/welcome-family.webp"
              alt="Mar, Vic en Cleo"
              fill
              priority
              sizes="100vw"
              className="
                absolute inset-0 h-full w-full
                object-cover
                object-center
              "
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />

            {!showContent && (
              <div className="absolute bottom-[12vh] left-4 sm:left-6 flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={() => setShowContent(true)}
                  aria-label={t.continue}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/95 text-3xl text-[#5e6a50] shadow-lg backdrop-blur transition duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-transparent active:scale-95 md:h-16 md:w-16"
                >
                  ↓
                </button>

                <div className="text-xs tracking-wide text-white/95">
                  {t.continue}
                </div>
              </div>
            )}
          </section>
        </div>

        <div
          className={[
            "relative z-0 flex min-h-[100svh] flex-col justify-end px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24 sm:px-6",
            "transition-opacity duration-500",
            showContent ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white/85 p-5 text-center shadow-sm backdrop-blur-sm">
            <h1 className="text-2xl font-semibold leading-tight text-[#5e6a50]">
              {copy.title}
            </h1>

            <div className="mt-4 space-y-4 text-sm leading-7 text-[#7c8570]">
              {copy.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <p className="mt-4 text-sm font-medium text-[#7c8570]">
              {copy.signature}
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => router.push(`/${lang}/registry`)}
                className="min-h-[52px] w-full rounded-2xl bg-[#5e6a50] px-5 py-3 text-base font-medium text-white transition duration-200 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#5e6a50]/30 active:scale-[0.99]"
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