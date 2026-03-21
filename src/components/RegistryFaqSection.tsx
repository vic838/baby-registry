"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type Lang = "nl" | "ca" | "en" | "es";
type FaqVariant = "default" | "checkout" | "payment";

type FaqItem = {
  q: string;
  a: string;
};

const faqText: Record<
  Lang,
  {
    title: string;
    moreQuestions: string;
    moreQuestionsLink: string;
    items: FaqItem[];
  }
> = {
  nl: {
    title: "FAQ",
    moreQuestions: "Nog vragen?",
    moreQuestionsLink: "Bekijk alle vragen",
    items: [
      {
        q: "Hoe werkt de geboortelijst?",
        a: "Via de geboortelijst kan je een cadeau kiezen dat wij echt kunnen gebruiken. Je kan een volledig item schenken of, bij grotere cadeaus, een bijdrage doen.",
      },
      {
        q: "Hoe koop ik een cadeau?",
        a: "Open de geboortelijst, kies een item en voeg het toe. Daarna kan je afrekenen via de beschikbare betaalmethoden op de website.",
      },
      {
        q: "Kan ik bijdragen aan een groter cadeau?",
        a: "Ja, zeker. Voor sommige grotere items kan je zelf kiezen welk bedrag je wilt bijdragen, zodat meerdere mensen samen hetzelfde cadeau kunnen schenken.",
      },
      {
        q: "Hoe kan ik betalen?",
        a: "Na het afrekenen krijg je verschillende betaalopties te zien, zoals QR-code, Payconiq, Revolut, Wero of manuele overschrijving, afhankelijk van je toestel en de beschikbare instellingen.",
      },
      {
        q: "Is mijn betaling meteen bevestigd?",
        a: "Niet altijd. Soms wordt je betaling eerst als gemeld geregistreerd. Zodra we ze effectief ontvangen hebben, wordt ze bevestigd.",
      },
      {
        q: "Kan ik ook een vrije bijdrage doen?",
        a: "Ja, via de bijdrage-items op de lijst kan je ook bijdragen zonder een volledig specifiek cadeau te kiezen.",
      },
      {
        q: "Kan ik een cadeau kiezen dat niet op de lijst staat?",
        a: "De website is bedoeld voor de items en bijdragen die op de geboortelijst staan. Kies dus liefst iets van de lijst of doe een bijdrage.",
      },
      {
        q: "Moet ik zelf iets ophalen of meebrengen?",
        a: "Nee, alles verloopt via de geboortelijst. Je hoeft dus niets apart te regelen of af te halen.",
      },
    ],
  },
  ca: {
    title: "FAQ",
    moreQuestions: "Més preguntes?",
    moreQuestionsLink: "Veure totes les preguntes",
    items: [
      {
        q: "Com funciona la llista de naixement?",
        a: "A través de la llista de naixement pots triar un regal que realment ens serà útil. Pots regalar un article complet o, en el cas d'alguns regals més grans, fer una contribució.",
      },
      {
        q: "Com compro un regal?",
        a: "Obre la llista, tria un article i afegeix-lo. Després pots pagar amb els mètodes disponibles al web.",
      },
      {
        q: "Puc contribuir a un regal més gran?",
        a: "Sí. Per a alguns articles més grans pots escollir tu mateix l'import de la contribució.",
      },
      {
        q: "Com puc pagar?",
        a: "Després d'anar al pagament veuràs diferents opcions, com ara QR, Payconiq, Revolut, Wero o transferència bancària manual, segons el teu dispositiu i la configuració disponible.",
      },
      {
        q: "El meu pagament queda confirmat immediatament?",
        a: "No sempre. De vegades el teu pagament es registra primer com a notificat. Quan l'haguem rebut efectivament, el confirmarem.",
      },
      {
        q: "Puc fer una contribució lliure?",
        a: "Sí, a través dels articles de contribució també pots aportar un import sense triar un regal complet concret.",
      },
      {
        q: "Puc triar un regal que no sigui a la llista?",
        a: "El web està pensat per als articles i contribucions que apareixen a la llista. Per tant, tria preferiblement alguna cosa de la llista o fes una contribució.",
      },
      {
        q: "He d'anar a recollir alguna cosa o portar-la?",
        a: "No, tot passa a través de la llista. No has d'organitzar ni recollir res per separat.",
      },
    ],
  },
  en: {
    title: "FAQ",
    moreQuestions: "More questions?",
    moreQuestionsLink: "View all questions",
    items: [
      {
        q: "How does the registry work?",
        a: "Through the registry, you can choose a gift that we can truly use. You can offer a full item or contribute to a larger gift.",
      },
      {
        q: "How do I buy a gift?",
        a: "Open the registry, choose an item and add it. Then you can check out using the available payment methods on the website.",
      },
      {
        q: "Can I contribute to a larger gift?",
        a: "Yes. For some larger items, you can choose the amount you want to contribute so several people can offer the same gift together.",
      },
      {
        q: "How can I pay?",
        a: "After checkout you will see the available payment options, such as QR code, Payconiq, Revolut, Wero or manual bank transfer, depending on your device and the available setup.",
      },
      {
        q: "Is my payment confirmed immediately?",
        a: "Not always. Sometimes your payment is first registered as reported. Once we have actually received it, it will be confirmed.",
      },
      {
        q: "Can I make a free contribution?",
        a: "Yes, through contribution items you can also contribute an amount without choosing one full specific gift.",
      },
      {
        q: "Can I choose a gift that is not on the list?",
        a: "The website is intended for the items and contributions listed on the registry. So please choose something from the list or make a contribution.",
      },
      {
        q: "Do I need to pick anything up or bring anything?",
        a: "No, everything goes through the registry itself. You do not need to arrange or collect anything separately.",
      },
    ],
  },
  es: {
    title: "FAQ",
    moreQuestions: "¿Más preguntas?",
    moreQuestionsLink: "Ver todas las preguntas",
    items: [
      {
        q: "¿Cómo funciona la lista de nacimiento?",
        a: "A través de la lista de nacimiento puedes elegir un regalo que realmente podamos utilizar. Puedes regalar un artículo completo o, en regalos más grandes, hacer una contribución.",
      },
      {
        q: "¿Cómo compro un regalo?",
        a: "Abre la lista, elige un artículo y añádelo. Después puedes pagar con los métodos disponibles en la web.",
      },
      {
        q: "¿Puedo contribuir a un regalo más grande?",
        a: "Sí. Para algunos artículos más grandes puedes elegir tú mismo la cantidad que quieres aportar.",
      },
      {
        q: "¿Cómo puedo pagar?",
        a: "Después de ir al pago verás varias opciones, como código QR, Payconiq, Revolut, Wero o transferencia bancaria manual, según tu dispositivo y la configuración disponible.",
      },
      {
        q: "¿Mi pago queda confirmado de inmediato?",
        a: "No siempre. A veces el pago se registra primero como informado. Cuando lo recibamos efectivamente, lo confirmaremos.",
      },
      {
        q: "¿Puedo hacer una contribución libre?",
        a: "Sí, mediante los artículos de contribución también puedes aportar una cantidad sin elegir un regalo completo concreto.",
      },
      {
        q: "¿Puedo elegir un regalo que no esté en la lista?",
        a: "La web está pensada para los artículos y contribuciones que figuran en la lista. Por eso, elige preferiblemente algo de la lista o haz una contribución.",
      },
      {
        q: "¿Tengo que recoger algo o llevar algo?",
        a: "No, todo se gestiona a través de la propia lista. No necesitas organizar ni recoger nada por separado.",
      },
    ],
  },
};

const variantQuestions: Record<Lang, Record<Exclude<FaqVariant, "default">, string[]>> = {
  nl: {
    checkout: [
      "Hoe kan ik betalen?",
      "Is mijn betaling meteen bevestigd?",
      "Hoe koop ik een cadeau?",
    ],
    payment: [
      "Hoe kan ik betalen?",
      "Is mijn betaling meteen bevestigd?",
      "Kan ik ook een vrije bijdrage doen?",
    ],
  },
  ca: {
    checkout: [
      "Com puc pagar?",
      "El meu pagament queda confirmat immediatament?",
      "Com compro un regal?",
    ],
    payment: [
      "Com puc pagar?",
      "El meu pagament queda confirmat immediatament?",
      "Puc fer una contribució lliure?",
    ],
  },
  en: {
    checkout: [
      "How can I pay?",
      "Is my payment confirmed immediately?",
      "How do I buy a gift?",
    ],
    payment: [
      "How can I pay?",
      "Is my payment confirmed immediately?",
      "Can I make a free contribution?",
    ],
  },
  es: {
    checkout: [
      "¿Cómo puedo pagar?",
      "¿Mi pago queda confirmado de inmediato?",
      "¿Cómo compro un regalo?",
    ],
    payment: [
      "¿Cómo puedo pagar?",
      "¿Mi pago queda confirmado de inmediato?",
      "¿Puedo hacer una contribución libre?",
    ],
  },
};

function getSafeLang(value?: string): Lang {
  if (value === "nl" || value === "ca" || value === "en" || value === "es") {
    return value;
  }
  return "nl";
}

export default function RegistryFaqSection({
  lang,
  compact = true,
  variant = "default",
}: {
  lang?: string;
  compact?: boolean;
  variant?: FaqVariant;
}) {
  const safeLang = getSafeLang(lang);
  const text = faqText[safeLang];

  const items = useMemo(() => {
    if (variant === "checkout" || variant === "payment") {
      const allowedQuestions = new Set(variantQuestions[safeLang][variant]);
      return text.items.filter((item) => allowedQuestions.has(item.q));
    }

    return compact ? text.items.slice(0, 6) : text.items;
  }, [compact, safeLang, text.items, variant]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mt-12 rounded-3xl border border-[#e7ebdf] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[#5e6a50]">{text.title}</h2>

        {compact ? (
          <Link
            href={`/${safeLang}/faq`}
            className="text-sm font-medium text-[#5e6a50] hover:underline"
          >
            {text.moreQuestionsLink}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={`${index}-${item.q}`}
              className="overflow-hidden rounded-2xl border border-[#e7ebdf] bg-[#fcfcfa]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-[#42503a] sm:text-base">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#7c8570] transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen ? (
                <div className="border-t border-[#edf0e8] px-4 py-4 text-sm leading-6 text-[#6d7562]">
                  {item.a}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {compact ? (
        <div className="mt-5 text-sm text-[#7c8570]">
          {text.moreQuestions}{" "}
          <Link
            href={`/${safeLang}/faq`}
            className="font-medium text-[#5e6a50] hover:underline"
          >
            {text.moreQuestionsLink}
          </Link>
        </div>
      ) : null}
    </section>
  );
}