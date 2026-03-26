"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  function go(lang: string) {
    router.push(`/${lang}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-neutral-50">
      <div className="relative min-h-screen w-full">
        {/* HERO IMAGE LAYER */}
        <div
          className={[
            "absolute inset-0 z-10 transition-transform duration-700 ease-in-out",
            showLanguageMenu ? "-translate-y-[58vh]" : "translate-y-0",
          ].join(" ")}
        >
          <section
            className="flex min-h-screen w-full cursor-pointer items-center justify-center overflow-hidden bg-neutral-50 px-4 py-4 sm:px-6 md:px-8"
            onClick={() => setShowLanguageMenu(true)}
            aria-label="Ga verder naar taalkeuze"
          >
            <img
              src="/landing-baby.webp"
              alt="Cleo"
              className="max-h-[100svh] max-w-full w-auto object-contain"
            />
          </section>
        </div>

        {/* LANGUAGE MENU LAYER */}
        <div
          className={[
            "relative z-0 flex min-h-screen flex-col justify-end px-4 pb-8 pt-24 sm:px-6",
            "transition-opacity duration-500",
            showLanguageMenu ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div className="mx-auto mb-4 w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowLanguageMenu(false)}
              className="text-sm text-[#5e6a50] transition hover:opacity-80"
            >
              ← Back
            </button>
          </div>

          <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => go("nl")}
              className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
            >
              Nederlands
            </button>

            <button
              type="button"
              onClick={() => go("ca")}
              className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
            >
              Català
            </button>

            <button
              type="button"
              onClick={() => go("en")}
              className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
            >
              English
            </button>

            <button
              type="button"
              onClick={() => go("es")}
              className="rounded-xl border border-[#8a9478] bg-white p-4 text-[#5e6a50] shadow-sm transition hover:bg-neutral-100"
            >
              Español
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}