// src/content/welcomeCopy.ts
export type Lang = "nl" | "ca" | "en" | "es";

export const welcomeCopy: Record<
  Lang,
  {
    title: string;
    body: string[];
    signature: string;
  }
> = {
  nl: {
    title: "Welkom bij de geboortelijst van Cleo",
    body: [
      "Lieve vrienden en familie,",
      "Het doet ons veel plezier dat jullie deel uitmaken van dit bijzondere begin.",
      "Via deze lijst verzamelen we enkele cadeautjes om Cleo een warme en liefdevolle start te geven. Elk gebaar betekent oprecht veel voor ons.",
      "Met roots in Catalonië en Vlaanderen zal Cleo opgroeien tussen twee werelden, dicht bij natuur en avontuur. De Pyreneeën wachten al… en ook onze twee border collies kijken uit naar hun nieuwe kleine metgezel.",
      "Dankjewel om dit speciale moment met ons te delen! 🧡"
    ],
    signature: "Met veel liefs, Mar & Vic"
  },
  ca: {
    title: "Benvinguts a la llista de naixement de la Cleo",
    body: [
      "Estimats amics i família,",
      "Ens fa molta il·lusió que formeu part d’aquest moment tan especial.",
      "Amb aquesta llista hem recollit alguns regals que ens ajudaran a donar a la Cleo un inici ple d’amor. Cada gest, per petit que sigui, significa molt per a nosaltres.",
      "Amb arrels a Catalunya i a Flandes, la Cleo creixerà entre dos mons, a prop de la natura i de l’aventura. Els Pirineus ja l’esperen… i els nostres dos border collies també tenen ganes de conèixer la seva nova petita companya.",
      "Gràcies per compartir aquest moment tan especial amb nosaltres! 🧡"
    ],
    signature: "Amb molt d’afecte, Mar & Vic"
  },
  en: {
    title: "Welcome to Cleo’s baby registry",
    body: [
      "Dear friends and family,",
      "We are truly happy to have you be part of this special beginning.",
      "Through this list, we’ve gathered a few gifts that will help us give Cleo a warm and loving start. Every gesture, no matter how small, means a great deal to us.",
      "With roots in Catalonia and Flanders, Cleo will grow up between two worlds, close to nature and adventure. The Pyrenees are already waiting… and our two border collies are looking forward to meeting their new little companion.",
      "Thank you for sharing this special moment with us! 🧡"
    ],
    signature: "With love, Mar & Vic"
  },
  es: {
    title: "Bienvenidos a la lista de nacimiento de Cleo",
    body: [
      "Queridos amigos y familia,",
      "Nos hace mucha ilusión que forméis parte de este momento tan especial.",
      "A través de esta lista hemos reunido algunos regalos que nos ayudarán a darle a Cleo un comienzo lleno de cariño. Cada gesto, por pequeño que sea, significa mucho para nosotros.",
      "Con raíces en Cataluña y en Flandes, Cleo crecerá entre dos mundos, cerca de la naturaleza y la aventura. Los Pirineos ya la esperan… y nuestros dos border collies también están deseando conocer a su nueva pequeña compañera.",
      "Gracias por compartir este momento tan especial con nosotros! 🧡"
    ],
    signature: "Con mucho cariño, Mar & Vic"
  }
};