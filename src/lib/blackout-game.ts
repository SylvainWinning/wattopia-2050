import type { LiveMixSnapshot } from "./live-mix";

export const MAX_DECISIONS = 5;

export type MissionModeId = "france" | "paris" | "future2050";

export type CityState = "on" | "priority" | "fragile" | "off";

export type MissionMetrics = {
  stability: number;
  co2Score: number;
  budget: number;
  citizenTrust: number;
  blackoutRisk: number;
  lightsOn: number;
};

export type MetricEffect = Partial<MissionMetrics>;

export type MissionEvent = {
  title: string;
  text: string;
  effect: MetricEffect;
};

export type MissionMode = {
  id: MissionModeId;
  title: string;
  shortTitle: string;
  pitch: string;
  objective: string;
  atmosphere: string;
  start: MissionMetrics;
  events: readonly MissionEvent[];
  scenes: readonly CrisisScene[];
};

export type ActionId =
  | "batteries"
  | "gas"
  | "domestic"
  | "imports"
  | "priority"
  | "industry"
  | "sobriety"
  | "hydro"
  | "wait"
  | "overimport"
  | "publicCut"
  | "forcedRestart";

export type MissionAction = {
  id: ActionId;
  title: string;
  shortTitle: string;
  icon: "battery" | "flame" | "home" | "import" | "shield" | "factory" | "megaphone" | "waves";
  description: string;
  tradeoff: string;
  effect: MetricEffect;
};

export type CrisisChoice = {
  id: ActionId;
  title: string;
  description: string;
  tactical: string;
  trap?: boolean;
  lesson?: string;
  protect?: readonly string[];
  pressure?: readonly string[];
  effect: MetricEffect;
};

export type CrisisScene = {
  hour: string;
  title: string;
  alert: string;
  cityId: string;
  operator: string;
  choices: readonly CrisisChoice[];
  event: MissionEvent;
};

export type MissionStep = {
  decisionNumber: number;
  action: MissionAction;
  choice: CrisisChoice;
  scene: CrisisScene;
  event: MissionEvent;
  metrics: MissionMetrics;
  narration: string;
  operatorMessage: string;
  cityStates: Record<string, CityState>;
};

export type MissionResultKind = "stable" | "partial" | "blackout";

export type MissionResult = {
  kind: MissionResultKind;
  title: string;
  text: string;
  score: number;
  bestPoint: string;
  biggestTradeoff: string;
  tips: string[];
};

export type Achievement = {
  id: string;
  title: string;
  text: string;
  tone: "stability" | "carbon" | "trust" | "budget" | "risk";
};

export type GameRank = "S" | "A" | "B" | "C" | "D";

export type BonusObjective = {
  id: string;
  title: string;
  text: string;
  completed: boolean;
};

export type MissionState = {
  mode: MissionMode;
  selectedActions: MissionAction[];
  metrics: MissionMetrics;
  steps: MissionStep[];
  result: MissionResult;
  decisionsRemaining: number;
  cityStates: Record<string, CityState>;
  activeScene: CrisisScene | null;
  operatorMessages: string[];
  strategyProfile: string;
  achievements: Achievement[];
  gameRank: GameRank;
  commandPoints: number;
  comboLabel: string;
  bonusObjectives: BonusObjective[];
};

export type GridCity = {
  id: string;
  name: string;
  x: number;
  y: number;
  threshold: number;
  load: number;
  reserve: number;
  critical?: boolean;
};

export type GridEdge = {
  from: string;
  to: string;
  corridor: "north" | "west" | "east" | "south" | "backbone";
};

const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const round = (value: number): number => Math.round(clamp(value));

const applyEffect = (metrics: MissionMetrics, effect: MetricEffect): MissionMetrics => {
  const next: MissionMetrics = {
    stability: clamp(metrics.stability + (effect.stability ?? 0)),
    co2Score: clamp(metrics.co2Score + (effect.co2Score ?? 0)),
    budget: clamp(metrics.budget + (effect.budget ?? 0)),
    citizenTrust: clamp(metrics.citizenTrust + (effect.citizenTrust ?? 0)),
    blackoutRisk: clamp(metrics.blackoutRisk + (effect.blackoutRisk ?? 0)),
    lightsOn: clamp(metrics.lightsOn + (effect.lightsOn ?? 0)),
  };

  next.blackoutRisk = clamp(
    next.blackoutRisk -
      Math.max(0, next.stability - 50) * 0.1 +
      Math.max(0, 52 - next.stability) * 0.16 -
      Math.max(0, next.citizenTrust - 55) * 0.04 +
      Math.max(0, 45 - next.budget) * 0.08,
  );
  next.lightsOn = clamp(
    next.lightsOn +
      Math.max(0, next.stability - 50) * 0.09 -
      Math.max(0, next.blackoutRisk - 45) * 0.11 +
      Math.max(0, next.citizenTrust - 50) * 0.04,
  );

  return {
    stability: round(next.stability),
    co2Score: round(next.co2Score),
    budget: round(next.budget),
    citizenTrust: round(next.citizenTrust),
    blackoutRisk: round(next.blackoutRisk),
    lightsOn: round(next.lightsOn),
  };
};

export const gridCities: readonly GridCity[] = [
  { id: "lille", name: "Lille", x: 47, y: 15, threshold: 54, load: 68, reserve: 38 },
  { id: "paris", name: "Paris", x: 45, y: 31, threshold: 40, load: 92, reserve: 52, critical: true },
  { id: "strasbourg", name: "Strasbourg", x: 75, y: 35, threshold: 64, load: 58, reserve: 30 },
  { id: "nantes", name: "Nantes", x: 24, y: 47, threshold: 60, load: 54, reserve: 44 },
  { id: "bordeaux", name: "Bordeaux", x: 31, y: 67, threshold: 58, load: 56, reserve: 42 },
  { id: "lyon", name: "Lyon", x: 61, y: 59, threshold: 48, load: 78, reserve: 50, critical: true },
  { id: "toulouse", name: "Toulouse", x: 43, y: 79, threshold: 62, load: 60, reserve: 36 },
  { id: "marseille", name: "Marseille", x: 66, y: 83, threshold: 56, load: 66, reserve: 34 },
];

export const gridEdges: readonly GridEdge[] = [
  { from: "lille", to: "paris", corridor: "north" },
  { from: "paris", to: "nantes", corridor: "west" },
  { from: "paris", to: "strasbourg", corridor: "east" },
  { from: "paris", to: "lyon", corridor: "backbone" },
  { from: "nantes", to: "bordeaux", corridor: "west" },
  { from: "bordeaux", to: "toulouse", corridor: "south" },
  { from: "lyon", to: "marseille", corridor: "south" },
  { from: "lyon", to: "strasbourg", corridor: "east" },
  { from: "toulouse", to: "marseille", corridor: "south" },
  { from: "nantes", to: "paris", corridor: "backbone" },
];

const scene = (
  hour: string,
  title: string,
  alert: string,
  cityId: string,
  operator: string,
  event: MissionEvent,
  choices: readonly CrisisChoice[],
): CrisisScene => ({ hour, title, alert, cityId, operator, event, choices });

const trapChoiceBank: readonly CrisisChoice[] = [
  {
    id: "wait",
    title: "Attendre la confirmation complète",
    description: "Ne rien déclencher tant que toutes les données ne sont pas consolidées.",
    tactical: "Semble prudent, mais le réseau n'attend pas.",
    lesson: "Piège: en crise réseau, attendre peut laisser la cascade démarrer.",
    trap: true,
    pressure: ["lille", "paris"],
    effect: { stability: -13, co2Score: 2, budget: 4, citizenTrust: -3, blackoutRisk: 18, lightsOn: -12 },
  },
  {
    id: "overimport",
    title: "Acheter tout ce qui est disponible",
    description: "Surpayer massivement le marché européen pour éviter de choisir localement.",
    tactical: "La facilité immédiate peut vider le budget et importer du CO2.",
    lesson: "Piège: l'interconnexion aide, mais elle n'est ni infinie ni toujours propre.",
    trap: true,
    protect: ["strasbourg", "paris"],
    pressure: ["bordeaux"],
    effect: { stability: 10, co2Score: -18, budget: -32, citizenTrust: -6, blackoutRisk: -6, lightsOn: 5 },
  },
  {
    id: "publicCut",
    title: "Couper vite les quartiers résidentiels",
    description: "Délester largement les foyers pour garder les infrastructures sous tension.",
    tactical: "Très brutal: la stabilité remonte, la confiance s'effondre.",
    lesson: "Piège: une coupure large peut sauver des MW mais casser l'acceptabilité.",
    trap: true,
    protect: ["paris", "lyon"],
    pressure: ["lille", "nantes", "bordeaux"],
    effect: { stability: 16, co2Score: 4, budget: 3, citizenTrust: -28, blackoutRisk: -9, lightsOn: -18 },
  },
  {
    id: "forcedRestart",
    title: "Forcer un redémarrage impossible",
    description: "Promettre une puissance pilotable qui ne peut pas arriver à temps.",
    tactical: "Bonne idée sur le papier, trop lente pour ce tour.",
    lesson: "Piège: toute production n'est pas mobilisable en quelques minutes.",
    trap: true,
    pressure: ["strasbourg", "lyon"],
    effect: { stability: -9, co2Score: -6, budget: -11, citizenTrust: -10, blackoutRisk: 14, lightsOn: -8 },
  },
];

function extraChoicesForScene(sceneIndex: number, modeId: MissionModeId): readonly CrisisChoice[] {
  const offset = modeId === "france" ? 0 : modeId === "paris" ? 1 : 2;
  const first = trapChoiceBank[(sceneIndex + offset) % trapChoiceBank.length];
  const second = trapChoiceBank[(sceneIndex + offset + 2) % trapChoiceBank.length];
  return [first, second];
}

function sceneWithExtraChoices(sceneValue: CrisisScene, sceneIndex: number, modeId: MissionModeId): CrisisScene {
  const existingIds = new Set(sceneValue.choices.map((choice) => choice.id));
  const extraChoices = extraChoicesForScene(sceneIndex, modeId).filter((choice) => !existingIds.has(choice.id));

  return {
    ...sceneValue,
    choices: [...sceneValue.choices, ...extraChoices],
  };
}

export const missionModes: Record<MissionModeId, MissionMode> = {
  france: {
    id: "france",
    title: "Mission France",
    shortTitle: "France",
    pitch:
      "Le réseau national est sous tension. La demande grimpe, certaines productions baissent, et plusieurs grandes villes risquent de s'éteindre.",
    objective: "Stabiliser la France entière en 5 décisions.",
    atmosphere: "France partiellement sombre, lignes nationales instables, décisions rapides.",
    start: {
      stability: 46,
      co2Score: 67,
      budget: 58,
      citizenTrust: 56,
      blackoutRisk: 74,
      lightsOn: 54,
    },
    events: [
      {
        title: "Pic de froid à 19h30",
        text: "La demande augmente brutalement dans le nord et l'est.",
        effect: { stability: -7, blackoutRisk: 9, lightsOn: -6 },
      },
      {
        title: "Le vent tombe sur l'Atlantique",
        text: "Les prévisions de production éolienne sont revues à la baisse.",
        effect: { stability: -6, blackoutRisk: 7, co2Score: -2 },
      },
      {
        title: "Interconnexion saturée",
        text: "L'aide européenne devient moins disponible au pire moment.",
        effect: { budget: -5, stability: -4, blackoutRisk: 8 },
      },
      {
        title: "Réponse citoyenne partielle",
        text: "Les usages baissent, mais pas assez pour relâcher toute la tension.",
        effect: { stability: 4, citizenTrust: 3, blackoutRisk: -4, lightsOn: 3 },
      },
      {
        title: "Dernière pointe du soir",
        text: "Le réseau joue sa marge finale autour des grandes métropoles.",
        effect: { stability: -3, blackoutRisk: 5 },
      },
    ],
    scenes: [
      scene(
        "19:08",
        "Le Nord décroche",
        "La fréquence baisse sur l'axe Lille-Paris. Si Paris absorbe tout, le nord passe en coupure tournante.",
        "lille",
        "Dispatch national: il faut gagner 900 MW en moins de 7 minutes.",
        {
          title: "Pic de froid à 19h30",
          text: "La demande augmente brutalement dans le nord et l'est.",
          effect: { stability: -7, blackoutRisk: 9, lightsOn: -6 },
        },
        [
          {
            id: "batteries",
            title: "Décharger les batteries du nord",
            description: "Injecter très vite une réserve courte sur Lille et Paris.",
            tactical: "Puissant sur la fréquence, limité dans le temps.",
            protect: ["lille", "paris"],
            effect: { stability: 21, co2Score: 5, budget: -13, citizenTrust: 2, blackoutRisk: -19, lightsOn: 12 },
          },
          {
            id: "gas",
            title: "Allumer le gaz de secours",
            description: "Apporter de la puissance pilotable avant que la cascade démarre.",
            tactical: "Sauve vite, mais abîme le carbone.",
            protect: ["lille", "paris", "lyon"],
            effect: { stability: 26, co2Score: -26, budget: -15, citizenTrust: -5, blackoutRisk: -23, lightsOn: 14 },
          },
          {
            id: "sobriety",
            title: "Alerte sobriété nationale",
            description: "Demander une baisse immédiate des usages non essentiels.",
            tactical: "Moins cher, plus incertain.",
            protect: ["lille"],
            effect: { stability: 12, co2Score: 10, budget: 8, citizenTrust: -4, blackoutRisk: -11, lightsOn: 7 },
          },
        ],
      ),
      scene(
        "19:21",
        "La façade Atlantique perd le vent",
        "Nantes et Bordeaux deviennent des points faibles. La marge ouest tombe sous le seuil de sécurité.",
        "nantes",
        "Météo réseau: chute de production plus forte que prévu sur l'Atlantique.",
        {
          title: "Le vent tombe sur l'Atlantique",
          text: "Les prévisions de production éolienne sont revues à la baisse.",
          effect: { stability: -6, blackoutRisk: 7, co2Score: -2 },
        },
        [
          {
            id: "imports",
            title: "Acheter sur les interconnexions",
            description: "Ramener de l'électricité par les frontières avant la saturation.",
            tactical: "Rapide, coûteux, dépendant des voisins.",
            protect: ["strasbourg", "lyon", "paris"],
            effect: { stability: 18, co2Score: -4, budget: -18, citizenTrust: -4, blackoutRisk: -15, lightsOn: 10 },
          },
          {
            id: "hydro",
            title: "Réinjecter l'hydraulique disponible",
            description: "Utiliser la réserve hydraulique pour soutenir l'ouest et le sud.",
            tactical: "Bas-carbone, réserve rare.",
            protect: ["bordeaux", "toulouse", "lyon"],
            effect: { stability: 16, co2Score: 12, budget: -8, citizenTrust: 5, blackoutRisk: -14, lightsOn: 9 },
          },
          {
            id: "domestic",
            title: "Décaler les usages domestiques",
            description: "Reporter chauffage, cuisson et recharge après le pic.",
            tactical: "Propre, mais socialement visible.",
            protect: ["nantes", "bordeaux"],
            effect: { stability: 15, co2Score: 8, budget: 5, citizenTrust: -10, blackoutRisk: -14, lightsOn: 8 },
          },
        ],
      ),
      scene(
        "19:37",
        "Paris demande une priorité vitale",
        "Les hôpitaux, transports et télécoms exigent une alimentation stable. Les zones résidentielles restent exposées.",
        "paris",
        "Préfecture: protéger l'essentiel, mais éviter une rupture de confiance.",
        {
          title: "Interconnexion saturée",
          text: "L'aide européenne devient moins disponible au pire moment.",
          effect: { budget: -5, stability: -4, blackoutRisk: 8 },
        },
        [
          {
            id: "priority",
            title: "Prioriser hôpitaux et transports",
            description: "Sanctuariser les usages vitaux avant le confort résidentiel.",
            tactical: "Très accepté, mais ne rallume pas tout.",
            protect: ["paris", "lyon"],
            pressure: ["nantes", "bordeaux"],
            effect: { stability: 8, co2Score: 0, budget: -6, citizenTrust: 18, blackoutRisk: -8, lightsOn: 5 },
          },
          {
            id: "industry",
            title: "Effacer les gros industriels",
            description: "Demander une baisse immédiate aux sites électro-intensifs.",
            tactical: "Soulage fort, coûte à l'activité.",
            protect: ["paris", "strasbourg", "lyon"],
            effect: { stability: 20, co2Score: 10, budget: -20, citizenTrust: -8, blackoutRisk: -16, lightsOn: 9 },
          },
          {
            id: "gas",
            title: "Relancer du gaz en appoint",
            description: "Combler la marge restante avec de la production pilotable.",
            tactical: "Solution dure mais immédiate.",
            protect: ["paris", "lille", "lyon"],
            effect: { stability: 23, co2Score: -22, budget: -13, citizenTrust: -6, blackoutRisk: -20, lightsOn: 12 },
          },
        ],
      ),
      scene(
        "19:49",
        "Le Sud-Est clignote",
        "Lyon et Marseille supportent la dernière pointe. Si la liaison Rhône décroche, la cascade part vers le sud.",
        "lyon",
        "Salle de crise: le réseau tient, mais les marges sont devenues microscopiques.",
        {
          title: "Réponse citoyenne partielle",
          text: "Les usages baissent, mais pas assez pour relâcher toute la tension.",
          effect: { stability: 4, citizenTrust: 3, blackoutRisk: -4, lightsOn: 3 },
        },
        [
          {
            id: "hydro",
            title: "Ouvrir les vannes alpines",
            description: "Injecter l'hydraulique restante sur l'axe Rhône-Méditerranée.",
            tactical: "Très efficace localement, réserve finale.",
            protect: ["lyon", "marseille", "toulouse"],
            effect: { stability: 17, co2Score: 12, budget: -9, citizenTrust: 5, blackoutRisk: -14, lightsOn: 10 },
          },
          {
            id: "batteries",
            title: "Décharger le stockage urbain",
            description: "Stabiliser Lyon et Marseille avec les réserves courtes.",
            tactical: "Propre mais cher.",
            protect: ["lyon", "marseille"],
            effect: { stability: 20, co2Score: 5, budget: -12, citizenTrust: 2, blackoutRisk: -18, lightsOn: 12 },
          },
          {
            id: "industry",
            title: "Couper des charges industrielles",
            description: "Libérer de la puissance au prix d'un choc économique local.",
            tactical: "Efficace, impopulaire.",
            protect: ["lyon", "marseille"],
            pressure: ["toulouse"],
            effect: { stability: 20, co2Score: 10, budget: -20, citizenTrust: -8, blackoutRisk: -16, lightsOn: 9 },
          },
        ],
      ),
      scene(
        "20:02",
        "Dernière marge nationale",
        "La carte peut se rallumer ou s'éteindre. Il reste un arbitrage entre stabilité, coût et acceptabilité.",
        "toulouse",
        "Chef de quart: dernière décision. Après ça, le réseau tranche.",
        {
          title: "Dernière pointe du soir",
          text: "Le réseau joue sa marge finale autour des grandes métropoles.",
          effect: { stability: -3, blackoutRisk: 5 },
        },
        [
          {
            id: "sobriety",
            title: "Alerte sobriété de niveau rouge",
            description: "Un message national demande un effort visible pendant 20 minutes.",
            tactical: "Bas-carbone, demande de la confiance.",
            protect: ["toulouse", "bordeaux", "nantes"],
            effect: { stability: 13, co2Score: 11, budget: 8, citizenTrust: -5, blackoutRisk: -12, lightsOn: 7 },
          },
          {
            id: "imports",
            title: "Payer le dernier mégawatt",
            description: "Accepter un prix très élevé pour sécuriser la soirée.",
            tactical: "La stabilité passe avant le budget.",
            protect: ["strasbourg", "paris", "lyon"],
            effect: { stability: 19, co2Score: -4, budget: -21, citizenTrust: -4, blackoutRisk: -16, lightsOn: 11 },
          },
          {
            id: "priority",
            title: "Mode services essentiels",
            description: "Garantir les hôpitaux et transports, même si certains quartiers restent fragiles.",
            tactical: "Bon verdict social, moins bon visuellement.",
            protect: ["paris", "lyon", "marseille"],
            pressure: ["lille", "nantes"],
            effect: { stability: 8, co2Score: 0, budget: -6, citizenTrust: 18, blackoutRisk: -8, lightsOn: 5 },
          },
        ],
      ),
    ],
  },
  paris: {
    id: "paris",
    title: "Paris 19h42",
    shortTitle: "Paris",
    pitch:
      "Chauffage, cuisine, transports, bureaux et logements tirent tous sur le réseau. Paris approche de la coupure.",
    objective: "Sauver Paris et l'Ile-de-France sans sacrifier le reste du réseau.",
    atmosphere: "Zoom urbain, confiance plus sensible, décisions plus tendues.",
    start: {
      stability: 41,
      co2Score: 62,
      budget: 52,
      citizenTrust: 48,
      blackoutRisk: 80,
      lightsOn: 50,
    },
    events: [
      {
        title: "Métro et chauffage au même pic",
        text: "La pointe parisienne absorbe une partie de la réserve nationale.",
        effect: { stability: -8, blackoutRisk: 10, citizenTrust: -4 },
      },
      {
        title: "Hôpitaux sous contrainte",
        text: "Les opérateurs demandent une priorisation des services essentiels.",
        effect: { citizenTrust: -5, blackoutRisk: 6 },
      },
      {
        title: "Couronne fragile",
        text: "La banlieue absorbe des reports de consommation.",
        effect: { lightsOn: -7, stability: -4, blackoutRisk: 7 },
      },
      {
        title: "Signal sobriété reçu",
        text: "Les usages baissent dans une partie des foyers.",
        effect: { stability: 5, citizenTrust: 2, blackoutRisk: -5 },
      },
      {
        title: "Dernier arbitrage local",
        text: "Paris tient seulement si le réseau national reste solidaire.",
        effect: { budget: -4, blackoutRisk: 4 },
      },
    ],
    scenes: [
      scene(
        "19:42",
        "Paris tire tout le réseau",
        "La pointe urbaine combine chauffage, métro, ascenseurs, data centers et cuisines. La capitale devient le point chaud national.",
        "paris",
        "Dispatch Paris: si la fréquence descend encore, les arrondissements non prioritaires passent en délestage.",
        {
          title: "Métro et chauffage au même pic",
          text: "La pointe parisienne absorbe une partie de la réserve nationale.",
          effect: { stability: -8, blackoutRisk: 10, citizenTrust: -4 },
        },
        [
          {
            id: "priority",
            title: "Sanctuariser métro et hôpitaux",
            description: "Garantir transports, hôpitaux et télécoms avant le confort résidentiel.",
            tactical: "La confiance remonte, mais l'ouest reste exposé.",
            protect: ["paris", "lyon"],
            pressure: ["nantes", "bordeaux"],
            effect: { stability: 9, co2Score: 0, budget: -7, citizenTrust: 20, blackoutRisk: -9, lightsOn: 5 },
          },
          {
            id: "imports",
            title: "Appeler l'interconnexion est",
            description: "Ramener de la puissance vers Paris par l'axe Strasbourg-Lyon.",
            tactical: "Rapide, cher, dépendant des voisins.",
            protect: ["paris", "strasbourg", "lyon"],
            effect: { stability: 18, co2Score: -5, budget: -19, citizenTrust: -3, blackoutRisk: -16, lightsOn: 10 },
          },
          {
            id: "domestic",
            title: "Décaler chauffage résidentiel",
            description: "Envoyer un signal d'effacement court aux logements et bureaux.",
            tactical: "Propre, mais Paris accepte mal l'inconfort.",
            protect: ["paris"],
            pressure: ["lille"],
            effect: { stability: 15, co2Score: 8, budget: 4, citizenTrust: -12, blackoutRisk: -14, lightsOn: 8 },
          },
        ],
      ),
      scene(
        "19:48",
        "La couronne devient fragile",
        "Les reports de charge vers la périphérie font clignoter la boucle francilienne. Paris tient, mais le reste du réseau encaisse.",
        "paris",
        "Préfecture: priorité aux services essentiels, mais pas de coupure aveugle en petite couronne.",
        {
          title: "Hôpitaux sous contrainte",
          text: "Les opérateurs demandent une priorisation des services essentiels.",
          effect: { citizenTrust: -5, blackoutRisk: 6 },
        },
        [
          {
            id: "batteries",
            title: "Décharger les batteries urbaines",
            description: "Utiliser les réserves courtes des bâtiments et dépôts de bus.",
            tactical: "Très fort localement, réserve limitée.",
            protect: ["paris", "lille"],
            effect: { stability: 21, co2Score: 6, budget: -14, citizenTrust: 3, blackoutRisk: -19, lightsOn: 12 },
          },
          {
            id: "gas",
            title: "Lancer le gaz de pointe",
            description: "Apporter de la puissance pilotable pour éviter une coupure métropolitaine.",
            tactical: "Efficace, mauvais signal carbone.",
            protect: ["paris", "lyon", "strasbourg"],
            effect: { stability: 26, co2Score: -26, budget: -16, citizenTrust: -6, blackoutRisk: -23, lightsOn: 14 },
          },
          {
            id: "sobriety",
            title: "Message sobriété Ile-de-France",
            description: "Demander 20 minutes d'effort visible aux commerces, bureaux et foyers.",
            tactical: "Peu coûteux, adhésion incertaine.",
            protect: ["paris"],
            effect: { stability: 13, co2Score: 10, budget: 8, citizenTrust: -5, blackoutRisk: -12, lightsOn: 7 },
          },
        ],
      ),
      scene(
        "19:55",
        "Les transports menacent de décrocher",
        "Un incident de traction absorbe la marge restante. Sauver Paris peut pousser Lyon et Lille en tension.",
        "lyon",
        "Régulation transports: l'arrêt brutal serait plus coûteux socialement qu'un délestage ciblé.",
        {
          title: "Couronne fragile",
          text: "La banlieue absorbe des reports de consommation.",
          effect: { lightsOn: -7, stability: -4, blackoutRisk: 7 },
        },
        [
          {
            id: "industry",
            title: "Effacer l'industrie périurbaine",
            description: "Délester des sites volontaires pour sécuriser la traction et les gares.",
            tactical: "Soulage fort, coûte à l'activité.",
            protect: ["paris", "lyon"],
            pressure: ["lille"],
            effect: { stability: 21, co2Score: 9, budget: -21, citizenTrust: -9, blackoutRisk: -17, lightsOn: 9 },
          },
          {
            id: "priority",
            title: "Mode gares et hôpitaux",
            description: "Réserver la puissance aux lieux vitaux et aux transports collectifs.",
            tactical: "Acceptable, mais quartiers résidentiels fragiles.",
            protect: ["paris", "lyon"],
            pressure: ["bordeaux", "nantes"],
            effect: { stability: 8, co2Score: 0, budget: -6, citizenTrust: 19, blackoutRisk: -8, lightsOn: 5 },
          },
          {
            id: "hydro",
            title: "Pousser l'hydraulique vers Rhône-Paris",
            description: "Injecter une réserve bas-carbone pour soutenir l'axe Lyon-Paris.",
            tactical: "Très propre, mais réserve finale.",
            protect: ["lyon", "paris", "marseille"],
            effect: { stability: 17, co2Score: 12, budget: -9, citizenTrust: 5, blackoutRisk: -15, lightsOn: 10 },
          },
        ],
      ),
      scene(
        "20:04",
        "Les citoyens réagissent",
        "L'alerte est comprise, mais les usages ne baissent pas partout. La confiance peut sauver ou casser la fin de mission.",
        "lille",
        "Cellule communication: un ordre trop brutal peut stabiliser le réseau et perdre l'adhésion.",
        {
          title: "Signal sobriété reçu",
          text: "Les usages baissent dans une partie des foyers.",
          effect: { stability: 5, citizenTrust: 2, blackoutRisk: -5 },
        },
        [
          {
            id: "sobriety",
            title: "Alerte claire et limitée",
            description: "Demander un effort daté, visible, expliqué, sans menace.",
            tactical: "Bonne pédagogie, effet modéré.",
            protect: ["paris", "lille"],
            effect: { stability: 13, co2Score: 11, budget: 8, citizenTrust: 1, blackoutRisk: -12, lightsOn: 7 },
          },
          {
            id: "domestic",
            title: "Décaler recharge et cuisson",
            description: "Piloter les usages flexibles sans couper les services critiques.",
            tactical: "Propre, mais inconfort diffus.",
            protect: ["paris", "nantes"],
            effect: { stability: 15, co2Score: 8, budget: 5, citizenTrust: -9, blackoutRisk: -14, lightsOn: 8 },
          },
          {
            id: "imports",
            title: "Acheter une marge sociale",
            description: "Payer très cher pour éviter une nouvelle demande aux habitants.",
            tactical: "Confort préservé, budget secoué.",
            protect: ["paris", "strasbourg", "lille"],
            effect: { stability: 18, co2Score: -4, budget: -20, citizenTrust: 2, blackoutRisk: -15, lightsOn: 10 },
          },
        ],
      ),
      scene(
        "20:12",
        "Dernier arbitrage francilien",
        "Paris peut rester allumée, mais le réseau national ne tolère plus d'erreur. Le sud et l'ouest surveillent la capitale.",
        "paris",
        "Chef de quart Paris: une dernière décision, puis la fréquence dira si la ville tient.",
        {
          title: "Dernier arbitrage local",
          text: "Paris tient seulement si le réseau national reste solidaire.",
          effect: { budget: -4, blackoutRisk: 4 },
        },
        [
          {
            id: "priority",
            title: "Bouclier services essentiels",
            description: "Verrouiller les usages vitaux de Paris et accepter quelques zones fragiles.",
            tactical: "Très fort socialement, moins spectaculaire.",
            protect: ["paris", "lyon", "marseille"],
            pressure: ["nantes"],
            effect: { stability: 9, co2Score: 0, budget: -6, citizenTrust: 19, blackoutRisk: -9, lightsOn: 5 },
          },
          {
            id: "batteries",
            title: "Dernière décharge urbaine",
            description: "Vider les réserves courtes pour éviter la coupure finale.",
            tactical: "Sauvetage net, budget bas.",
            protect: ["paris", "lille", "lyon"],
            effect: { stability: 20, co2Score: 5, budget: -14, citizenTrust: 2, blackoutRisk: -18, lightsOn: 12 },
          },
          {
            id: "gas",
            title: "Stabiliser par le gaz",
            description: "Assumer une solution pilotable pour finir la soirée sans blackout parisien.",
            tactical: "Réseau sauvé, carbone sacrifié.",
            protect: ["paris", "lyon", "strasbourg"],
            effect: { stability: 25, co2Score: -25, budget: -15, citizenTrust: -6, blackoutRisk: -22, lightsOn: 14 },
          },
        ],
      ),
    ],
  },
  future2050: {
    id: "future2050",
    title: "2050, nuit sans vent",
    shortTitle: "2050",
    pitch:
      "La France est devenue très renouvelable. Mais ce soir, le soleil est couché, le vent tombe et le stockage est sous pression.",
    objective: "Montrer le défi de l'intermittence, du stockage et du pilotage de la demande.",
    atmosphere: "Nocturne futuriste, batteries basses, éoliennes arrêtées.",
    start: {
      stability: 38,
      co2Score: 84,
      budget: 48,
      citizenTrust: 57,
      blackoutRisk: 83,
      lightsOn: 48,
    },
    events: [
      {
        title: "Solaire à zéro",
        text: "La nuit retire brutalement un pilier du mix bas-carbone.",
        effect: { stability: -7, blackoutRisk: 8, lightsOn: -5 },
      },
      {
        title: "Vent très faible",
        text: "La façade Atlantique produit moins que prévu.",
        effect: { stability: -8, blackoutRisk: 10 },
      },
      {
        title: "Batteries sous seuil critique",
        text: "La flexibilité devient la ressource rare de la soirée.",
        effect: { stability: -6, budget: -4, blackoutRisk: 8 },
      },
      {
        title: "Effacement accepté",
        text: "Une partie des usages pilotables se décale après le pic.",
        effect: { stability: 6, citizenTrust: -2, blackoutRisk: -6, co2Score: 3 },
      },
      {
        title: "Recharge impossible avant minuit",
        text: "Le réseau doit finir la mission avec les réserves restantes.",
        effect: { stability: -4, blackoutRisk: 6 },
      },
    ],
    scenes: [
      scene(
        "22:16",
        "Le solaire s'éteint",
        "La production photovoltaïque tombe à zéro. Les villes restent lumineuses, mais les batteries prennent tout le choc.",
        "toulouse",
        "Dispatch 2050: la question n'est plus le carbone, c'est la flexibilité restante.",
        {
          title: "Solaire à zéro",
          text: "La nuit retire brutalement un pilier du mix bas-carbone.",
          effect: { stability: -7, blackoutRisk: 8, lightsOn: -5 },
        },
        [
          {
            id: "batteries",
            title: "Décharger les batteries de quartier",
            description: "Utiliser les réserves distribuées avant la chute de fréquence.",
            tactical: "Propre et rapide, réserve rare.",
            protect: ["toulouse", "bordeaux", "paris"],
            effect: { stability: 22, co2Score: 6, budget: -13, citizenTrust: 3, blackoutRisk: -20, lightsOn: 13 },
          },
          {
            id: "domestic",
            title: "Piloter chauffe-eau et recharges",
            description: "Décaler les usages connectés vers l'après-pointe.",
            tactical: "Très 2050, mais sensible socialement.",
            protect: ["toulouse", "nantes"],
            effect: { stability: 16, co2Score: 9, budget: 6, citizenTrust: -11, blackoutRisk: -15, lightsOn: 8 },
          },
          {
            id: "hydro",
            title: "Mobiliser l'hydraulique nocturne",
            description: "Injecter une réserve bas-carbone pour compenser le solaire absent.",
            tactical: "Excellent carbone, stock limité.",
            protect: ["lyon", "toulouse", "marseille"],
            effect: { stability: 17, co2Score: 13, budget: -9, citizenTrust: 5, blackoutRisk: -15, lightsOn: 10 },
          },
        ],
      ),
      scene(
        "22:31",
        "Le vent tombe vraiment",
        "La façade Atlantique produit moins que prévu. Nantes et Bordeaux deviennent dépendantes du stockage et des interconnexions.",
        "nantes",
        "Météo réseau: le creux de vent est plus profond que les modèles annonçaient.",
        {
          title: "Vent très faible",
          text: "La façade Atlantique produit moins que prévu.",
          effect: { stability: -8, blackoutRisk: 10 },
        },
        [
          {
            id: "imports",
            title: "Importer une base nocturne",
            description: "Acheter une puissance stable pendant le creux météo.",
            tactical: "Sécurise vite, carbone variable.",
            protect: ["strasbourg", "paris", "nantes"],
            effect: { stability: 19, co2Score: -5, budget: -20, citizenTrust: -4, blackoutRisk: -16, lightsOn: 11 },
          },
          {
            id: "sobriety",
            title: "Mode sobriété automatisé",
            description: "Déclencher les contrats d'effacement résidentiels volontaires.",
            tactical: "Propre, dépend de l'adhésion.",
            protect: ["nantes", "bordeaux"],
            effect: { stability: 14, co2Score: 11, budget: 8, citizenTrust: -4, blackoutRisk: -12, lightsOn: 7 },
          },
          {
            id: "gas",
            title: "Allumer une poche gaz de secours",
            description: "Utiliser l'appoint fossile prévu pour les nuits sans vent.",
            tactical: "Puissant, mauvais pour le récit 2050.",
            protect: ["nantes", "paris", "lyon"],
            effect: { stability: 25, co2Score: -28, budget: -15, citizenTrust: -7, blackoutRisk: -23, lightsOn: 14 },
          },
        ],
      ),
      scene(
        "22:44",
        "Le stockage passe sous seuil",
        "Les batteries ont ralenti la crise, mais les réserves s'épuisent. Continuer à décharger peut sauver ce soir et fragiliser demain.",
        "lyon",
        "Dispatch stockage: si on vide tout, la recharge avant minuit est impossible.",
        {
          title: "Batteries sous seuil critique",
          text: "La flexibilité devient la ressource rare de la soirée.",
          effect: { stability: -6, budget: -4, blackoutRisk: 8 },
        },
        [
          {
            id: "hydro",
            title: "Basculer sur hydraulique",
            description: "Préserver les batteries en ouvrant les réserves hydrauliques.",
            tactical: "Bas-carbone, mais géographiquement contraint.",
            protect: ["lyon", "marseille", "toulouse"],
            effect: { stability: 17, co2Score: 13, budget: -9, citizenTrust: 5, blackoutRisk: -15, lightsOn: 10 },
          },
          {
            id: "industry",
            title: "Effacer les électro-intensifs",
            description: "Réduire la demande industrielle pour économiser le stockage.",
            tactical: "Très efficace, coût économique fort.",
            protect: ["lyon", "strasbourg", "paris"],
            pressure: ["marseille"],
            effect: { stability: 21, co2Score: 10, budget: -22, citizenTrust: -9, blackoutRisk: -17, lightsOn: 9 },
          },
          {
            id: "priority",
            title: "Réserver le stockage aux services vitaux",
            description: "Bloquer les dernières batteries pour hôpitaux, eau et transports.",
            tactical: "Excellent socialement, pas assez pour tout rallumer.",
            protect: ["paris", "lyon", "marseille"],
            pressure: ["bordeaux", "nantes"],
            effect: { stability: 9, co2Score: 1, budget: -7, citizenTrust: 20, blackoutRisk: -9, lightsOn: 5 },
          },
        ],
      ),
      scene(
        "22:58",
        "Les usages pilotables répondent",
        "Les foyers connectés, bornes et sites industriels flexibles peuvent passer en mode crise. La question devient sociale.",
        "bordeaux",
        "Plateforme flexibilité: on peut effacer beaucoup, mais la confiance citoyenne est le vrai plafond.",
        {
          title: "Effacement accepté",
          text: "Une partie des usages pilotables se décale après le pic.",
          effect: { stability: 6, citizenTrust: -2, blackoutRisk: -6, co2Score: 3 },
        },
        [
          {
            id: "domestic",
            title: "Effacer les usages domestiques flexibles",
            description: "Reporter recharge, chauffage d'eau et appareils non essentiels.",
            tactical: "Très propre, inconfort visible.",
            protect: ["bordeaux", "toulouse", "nantes"],
            effect: { stability: 16, co2Score: 9, budget: 6, citizenTrust: -11, blackoutRisk: -15, lightsOn: 8 },
          },
          {
            id: "sobriety",
            title: "Contrat sobriété national",
            description: "Activer les engagements volontaires avec récompense différée.",
            tactical: "Acceptable et bas-carbone.",
            protect: ["bordeaux", "nantes", "paris"],
            effect: { stability: 14, co2Score: 11, budget: 8, citizenTrust: -2, blackoutRisk: -12, lightsOn: 7 },
          },
          {
            id: "batteries",
            title: "Dernier boost batterie",
            description: "Acheter quelques minutes en vidant le stockage distribué.",
            tactical: "Spectaculaire, budget et réserves chutent.",
            protect: ["bordeaux", "paris", "lyon"],
            effect: { stability: 20, co2Score: 6, budget: -15, citizenTrust: 2, blackoutRisk: -18, lightsOn: 12 },
          },
        ],
      ),
      scene(
        "23:13",
        "Minuit ne rechargera rien",
        "La nuit sans vent continue. Le dernier ordre doit choisir entre stockage, sobriété et appoint pilotable.",
        "marseille",
        "Chef de quart 2050: le système bas-carbone tient seulement si la flexibilité tient aussi.",
        {
          title: "Recharge impossible avant minuit",
          text: "Le réseau doit finir la mission avec les réserves restantes.",
          effect: { stability: -4, blackoutRisk: 6 },
        },
        [
          {
            id: "sobriety",
            title: "Sobriété rouge jusqu'à minuit",
            description: "Assumer une baisse d'usage nationale pour éviter l'appoint fossile.",
            tactical: "Meilleur carbone, demande une adhésion forte.",
            protect: ["marseille", "toulouse", "bordeaux"],
            effect: { stability: 14, co2Score: 12, budget: 8, citizenTrust: -5, blackoutRisk: -13, lightsOn: 7 },
          },
          {
            id: "imports",
            title: "Importer la marge finale",
            description: "Acheter la puissance manquante le temps que le creux passe.",
            tactical: "Simple, cher, carbone hors contrôle.",
            protect: ["strasbourg", "paris", "marseille"],
            effect: { stability: 19, co2Score: -5, budget: -21, citizenTrust: -4, blackoutRisk: -16, lightsOn: 11 },
          },
          {
            id: "gas",
            title: "Assumer l'appoint gaz",
            description: "Utiliser le dernier secours pilotable malgré l'objectif bas-carbone.",
            tactical: "Blackout évité, score CO2 touché.",
            protect: ["marseille", "lyon", "paris"],
            effect: { stability: 25, co2Score: -28, budget: -15, citizenTrust: -7, blackoutRisk: -23, lightsOn: 14 },
          },
        ],
      ),
    ],
  },
};

export const missionActions: readonly MissionAction[] = [
  {
    id: "batteries",
    title: "Activer les batteries",
    shortTitle: "Batteries",
    icon: "battery",
    description: "Décharger le stockage disponible pour passer la pointe.",
    tradeoff: "Très efficace, mais cher et limité.",
    effect: { stability: 20, co2Score: 5, budget: -12, citizenTrust: 2, blackoutRisk: -18, lightsOn: 12 },
  },
  {
    id: "gas",
    title: "Lancer les centrales gaz de secours",
    shortTitle: "Gaz de secours",
    icon: "flame",
    description: "Injecter vite de la puissance pilotable.",
    tradeoff: "Sauve la stabilité, pénalise fortement le CO2.",
    effect: { stability: 25, co2Score: -25, budget: -15, citizenTrust: -5, blackoutRisk: -22, lightsOn: 14 },
  },
  {
    id: "domestic",
    title: "Décaler les usages domestiques",
    shortTitle: "Usages décalés",
    icon: "home",
    description: "Reporter chauffage, cuisson et recharge sur les heures moins tendues.",
    tradeoff: "Propre et utile, mais socialement sensible.",
    effect: { stability: 15, co2Score: 8, budget: 5, citizenTrust: -10, blackoutRisk: -14, lightsOn: 8 },
  },
  {
    id: "imports",
    title: "Importer de l'électricité",
    shortTitle: "Imports",
    icon: "import",
    description: "Solliciter les interconnexions européennes.",
    tradeoff: "Rapide, coûteux et dépendant du contexte extérieur.",
    effect: { stability: 18, co2Score: -4, budget: -18, citizenTrust: -4, blackoutRisk: -15, lightsOn: 10 },
  },
  {
    id: "priority",
    title: "Prioriser hôpitaux et transports",
    shortTitle: "Services essentiels",
    icon: "shield",
    description: "Garder les usages vitaux allumés avant le confort résidentiel.",
    tradeoff: "La confiance monte, mais certaines zones restent fragiles.",
    effect: { stability: 8, co2Score: 0, budget: -6, citizenTrust: 18, blackoutRisk: -8, lightsOn: 5 },
  },
  {
    id: "industry",
    title: "Baisser la consommation industrielle",
    shortTitle: "Industrie réduite",
    icon: "factory",
    description: "Demander un effacement rapide aux gros consommateurs.",
    tradeoff: "Soulage le réseau, coûte cher à l'activité.",
    effect: { stability: 20, co2Score: 10, budget: -20, citizenTrust: -8, blackoutRisk: -16, lightsOn: 9 },
  },
  {
    id: "sobriety",
    title: "Déclencher une alerte sobriété nationale",
    shortTitle: "Alerte sobriété",
    icon: "megaphone",
    description: "Demander à tout le pays de réduire immédiatement la demande.",
    tradeoff: "Peu coûteux, propre, mais l'adhésion n'est jamais totale.",
    effect: { stability: 12, co2Score: 10, budget: 8, citizenTrust: -3, blackoutRisk: -11, lightsOn: 7 },
  },
  {
    id: "hydro",
    title: "Réinjecter l'hydraulique disponible",
    shortTitle: "Hydraulique",
    icon: "waves",
    description: "Utiliser la réserve hydraulique pour stabiliser la pointe.",
    tradeoff: "Très bas-carbone, mais la réserve est limitée.",
    effect: { stability: 15, co2Score: 12, budget: -8, citizenTrust: 5, blackoutRisk: -13, lightsOn: 9 },
  },
  {
    id: "wait",
    title: "Attendre",
    shortTitle: "Attente",
    icon: "megaphone",
    description: "Reporter la décision pour obtenir plus d'informations.",
    tradeoff: "Semble prudent, mais la fréquence peut décrocher.",
    effect: { stability: -13, co2Score: 2, budget: 4, citizenTrust: -3, blackoutRisk: 18, lightsOn: -12 },
  },
  {
    id: "overimport",
    title: "Suracheter l'électricité",
    shortTitle: "Surimport",
    icon: "import",
    description: "Acheter tout ce qui est disponible, peu importe le prix.",
    tradeoff: "Stabilise un peu, mais détruit budget et CO2.",
    effect: { stability: 10, co2Score: -18, budget: -32, citizenTrust: -6, blackoutRisk: -6, lightsOn: 5 },
  },
  {
    id: "publicCut",
    title: "Délester les foyers",
    shortTitle: "Délestage",
    icon: "shield",
    description: "Couper des quartiers résidentiels pour sauver les services vitaux.",
    tradeoff: "Technique efficace, socialement explosif.",
    effect: { stability: 16, co2Score: 4, budget: 3, citizenTrust: -28, blackoutRisk: -9, lightsOn: -18 },
  },
  {
    id: "forcedRestart",
    title: "Forcer une production lente",
    shortTitle: "Redémarrage",
    icon: "flame",
    description: "Compter sur une puissance qui ne peut pas arriver à temps.",
    tradeoff: "Promesse séduisante, mauvais timing.",
    effect: { stability: -9, co2Score: -6, budget: -11, citizenTrust: -10, blackoutRisk: 14, lightsOn: -8 },
  },
];

export function actionById(actionId: ActionId): MissionAction {
  const action = missionActions.find((candidate) => candidate.id === actionId);
  if (!action) throw new Error(`Action inconnue: ${actionId}`);
  return action;
}

function scenesForMode(mode: MissionMode): readonly CrisisScene[] {
  const sourceScenes = mode.scenes.length ? mode.scenes : missionModes.france.scenes;
  return sourceScenes.map((sceneValue, sceneIndex) => sceneWithExtraChoices(sceneValue, sceneIndex, mode.id));
}

function choiceForAction(sceneValue: CrisisScene, actionId: ActionId): CrisisChoice {
  const direct = sceneValue.choices.find((choice) => choice.id === actionId);
  if (direct) return direct;
  const base = actionById(actionId);
  return {
    id: base.id,
    title: base.title,
    description: base.description,
    tactical: base.tradeoff,
    effect: base.effect,
  };
}

function protectedCities(choices: readonly CrisisChoice[]): Set<string> {
  return new Set(choices.flatMap((choice) => choice.protect ?? []));
}

function pressuredCities(choices: readonly CrisisChoice[]): Set<string> {
  return new Set(choices.flatMap((choice) => choice.pressure ?? []));
}

export function getCityState(
  metrics: MissionMetrics,
  city: GridCity,
  selectedChoices: readonly CrisisChoice[] = [],
): CityState {
  const protectedSet = protectedCities(selectedChoices);
  const pressuredSet = pressuredCities(selectedChoices);
  const priorityMode = selectedChoices.some((choice) => choice.id === "priority");
  const protectionBonus = protectedSet.has(city.id) ? 18 : 0;
  const pressurePenalty = pressuredSet.has(city.id) ? 11 : 0;
  const criticalBonus = priorityMode && city.critical ? 8 : 0;
  const pressure =
    metrics.lightsOn -
    city.threshold -
    metrics.blackoutRisk * 0.2 +
    metrics.stability * 0.12 +
    city.reserve * 0.28 -
    city.load * 0.11 +
    protectionBonus +
    criticalBonus -
    pressurePenalty;

  if (priorityMode && city.critical && pressure >= -12) return "priority";
  if (pressure >= 4) return "on";
  if (pressure >= -15) return "fragile";
  return "off";
}

function simulateCascade(metrics: MissionMetrics, selectedChoices: readonly CrisisChoice[]): Record<string, CityState> {
  const firstPass = Object.fromEntries(
    gridCities.map((city) => [city.id, getCityState(metrics, city, selectedChoices)]),
  ) as Record<string, CityState>;

  const states = { ...firstPass };
  gridCities.forEach((city) => {
    if (states[city.id] !== "fragile") return;
    const weakNeighbors = gridEdges
      .filter((edge) => edge.from === city.id || edge.to === city.id)
      .map((edge) => (edge.from === city.id ? edge.to : edge.from))
      .filter((neighborId) => firstPass[neighborId] === "off").length;

    if (weakNeighbors >= 2 && metrics.stability < 58) states[city.id] = "off";
  });

  return states;
}

function deriveStrategyProfile(metrics: MissionMetrics, selectedActions: readonly MissionAction[]): string {
  const counts = new Map<ActionId, number>();
  selectedActions.forEach((action) => counts.set(action.id, (counts.get(action.id) ?? 0) + 1));
  const hasDemand = selectedActions.some((action) => action.id === "sobriety" || action.id === "domestic" || action.id === "industry");
  const hasStorage = selectedActions.some((action) => action.id === "batteries" || action.id === "hydro");

  if ((counts.get("gas") ?? 0) >= 2) return "Sauveur au gaz";
  if (hasStorage && metrics.co2Score >= 68) return "Architecte du stockage bas-carbone";
  if (hasDemand && metrics.budget >= 45) return "Stratège de la demande";
  if ((counts.get("priority") ?? 0) >= 1 && metrics.citizenTrust >= 62) return "Gardien des services essentiels";
  if (metrics.budget < 34) return "Opérateur sans marge budgétaire";
  if (metrics.blackoutRisk <= 35) return "Chef de quart sous contrôle";
  return "Arbitre de crise";
}

function deriveAchievements(
  metrics: MissionMetrics,
  selectedActions: readonly MissionAction[],
  cityStates: Record<string, CityState>,
): Achievement[] {
  const actionIds = new Set(selectedActions.map((action) => action.id));
  const allCriticalOn = ["paris", "lyon"].every((cityId) => cityStates[cityId] === "on" || cityStates[cityId] === "priority");
  const offCount = Object.values(cityStates).filter((state) => state === "off").length;
  const achievements: Achievement[] = [];

  if (metrics.blackoutRisk <= 35) {
    achievements.push({
      id: "blackout-dodged",
      title: "Blackout évité",
      text: "Risque final sous le seuil critique.",
      tone: "risk",
    });
  }
  if (metrics.co2Score >= 72 && !actionIds.has("gas")) {
    achievements.push({
      id: "low-carbon",
      title: "Bas-carbone",
      text: "Aucun recours gaz majeur dans la stratégie.",
      tone: "carbon",
    });
  }
  if (actionIds.has("batteries") && actionIds.has("hydro")) {
    achievements.push({
      id: "storage-master",
      title: "Maître du stockage",
      text: "Batteries et hydraulique mobilisées au bon moment.",
      tone: "stability",
    });
  }
  if (actionIds.has("sobriety") || actionIds.has("domestic")) {
    achievements.push({
      id: "demand-pilot",
      title: "Pilotage de la demande",
      text: "La consommation a participé au sauvetage.",
      tone: "trust",
    });
  }
  if (allCriticalOn) {
    achievements.push({
      id: "vital-services",
      title: "Services vitaux",
      text: "Paris et Lyon restent alimentés.",
      tone: "trust",
    });
  }
  if (offCount === 0 && metrics.lightsOn >= 72) {
    achievements.push({
      id: "full-grid",
      title: "Carte rallumée",
      text: "Aucune grande ville coupée au rapport final.",
      tone: "stability",
    });
  }
  if (metrics.budget >= 42) {
    achievements.push({
      id: "budget-held",
      title: "Marge budgétaire",
      text: "La crise est contenue sans vider les réserves.",
      tone: "budget",
    });
  }

  return achievements.slice(0, 5);
}

function deriveGameRank(score: number, metrics: MissionMetrics): GameRank {
  if (score >= 88 && metrics.blackoutRisk <= 28) return "S";
  if (score >= 76) return "A";
  if (score >= 62) return "B";
  if (score >= 45) return "C";
  return "D";
}

function deriveBonusObjectives(
  metrics: MissionMetrics,
  selectedActions: readonly MissionAction[],
  cityStates: Record<string, CityState>,
): BonusObjective[] {
  const actionIds = new Set(selectedActions.map((action) => action.id));
  const offCount = Object.values(cityStates).filter((state) => state === "off").length;

  return [
    {
      id: "no-gas",
      title: "Sans gaz",
      text: "Stabiliser sans centrale gaz de secours.",
      completed: selectedActions.length > 0 && !actionIds.has("gas") && metrics.stability >= 58,
    },
    {
      id: "no-city-off",
      title: "Aucune ville coupée",
      text: "Finir avec toutes les grandes villes alimentées.",
      completed: selectedActions.length > 0 && offCount === 0 && metrics.lightsOn >= 64,
    },
    {
      id: "public-trust",
      title: "Confiance maintenue",
      text: "Garder l'acceptabilité citoyenne au-dessus de 60.",
      completed: selectedActions.length > 0 && metrics.citizenTrust >= 60,
    },
  ];
}

function deriveComboLabel(selectedActions: readonly MissionAction[]): string {
  if (!selectedActions.length) return "Combo prêt";
  const ids = selectedActions.map((action) => action.id);
  const latest = selectedActions[selectedActions.length - 1];
  const storageCount = ids.filter((id) => id === "batteries" || id === "hydro").length;
  const demandCount = ids.filter((id) => id === "sobriety" || id === "domestic" || id === "industry").length;

  if (storageCount >= 2) return "Combo stockage x2";
  if (demandCount >= 2) return "Combo flexibilité x2";
  if (latest.id === "gas") return "Coup de force";
  if (latest.id === "priority") return "Bouclier vital";
  if (latest.id === "imports") return "Pont européen";
  return `${latest.shortTitle} engagé`;
}

function operatorMessage(sceneValue: CrisisScene, choice: CrisisChoice, metrics: MissionMetrics): string {
  if (metrics.blackoutRisk <= 35 && metrics.stability >= 70) {
    return `${sceneValue.hour} - ${choice.title}: fréquence stabilisée, la carte reprend de la lumière.`;
  }
  if (metrics.blackoutRisk >= 70 || metrics.stability < 45) {
    return `${sceneValue.hour} - ${choice.title}: marge insuffisante, risque de délestage encore élevé.`;
  }
  if (choice.id === "priority") {
    return `${sceneValue.hour} - ${choice.title}: les services vitaux tiennent, certains quartiers restent en tension.`;
  }
  return `${sceneValue.hour} - ${choice.title}: tension contenue, mais le prochain pic peut encore faire basculer le réseau.`;
}

function resultFromMetrics(metrics: MissionMetrics, selectedActions: readonly MissionAction[]): MissionResult {
  const score = round(
    metrics.stability * 0.3 +
      metrics.co2Score * 0.22 +
      metrics.budget * 0.14 +
      metrics.citizenTrust * 0.18 +
      (100 - metrics.blackoutRisk) * 0.16,
  );
  const gasUsed = selectedActions.some((action) => action.id === "gas");
  const sobrietyUsed = selectedActions.some((action) => action.id === "sobriety" || action.id === "domestic");
  const storageUsed = selectedActions.some((action) => action.id === "batteries" || action.id === "hydro");
  const expensiveActions = selectedActions.filter((action) => (action.effect.budget ?? 0) < -10).length;
  const kind: MissionResultKind =
    metrics.blackoutRisk <= 35 && metrics.stability >= 70 && metrics.lightsOn >= 72
      ? "stable"
      : metrics.blackoutRisk <= 68 && metrics.stability >= 48 && metrics.lightsOn >= 48
        ? "partial"
        : "blackout";

  const bestPoint =
    metrics.stability >= metrics.co2Score && metrics.stability >= metrics.citizenTrust
      ? "Tu as d'abord sécurisé la stabilité du réseau."
      : metrics.co2Score >= metrics.citizenTrust
        ? "Tu as gardé une stratégie relativement bas-carbone."
        : "Tu as préservé l'acceptabilité citoyenne dans une crise tendue.";
  const biggestTradeoff = gasUsed
    ? "Le gaz a protégé le réseau, mais il a fait chuter le score CO2."
    : expensiveActions >= 2
      ? "La France reste plus stable, mais le budget a beaucoup encaissé."
      : metrics.citizenTrust < 48
        ? "Les décisions techniques ont tendu la confiance citoyenne."
        : "Le compromis principal reste la faible marge réseau au pic.";

  const tips = [
    gasUsed
      ? "Utiliser le gaz trop tôt sécurise la pointe, mais dégrade fortement le carbone."
      : "Garder du secours pilotable disponible évite de dépendre d'une seule solution.",
    storageUsed
      ? "Le stockage et l'hydraulique sont précieux sur quelques heures critiques."
      : "Sans stockage, les renouvelables ne suffisent pas toujours pendant les creux météo.",
    sobrietyUsed
      ? "Décaler la demande peut éviter des coupures sans construire de production instantanée."
      : "La sobriété de crise réduit la demande, mais demande une adhésion sociale.",
  ];

  if (kind === "stable") {
    return {
      kind,
      title: "Réseau stabilisé",
      text: "Tu as évité le blackout. La France reste allumée, mais tes choix ont eu un coût.",
      score,
      bestPoint,
      biggestTradeoff,
      tips,
    };
  }

  if (kind === "partial") {
    return {
      kind,
      title: "Blackout partiel",
      text: "Tu as sauvé les services essentiels, mais plusieurs zones restent sous tension.",
      score,
      bestPoint,
      biggestTradeoff,
      tips,
    };
  }

  return {
    kind,
    title: "Blackout national",
    text: "Le réseau n'a pas tenu. Les décisions sont arrivées trop tard ou ont trop dégradé l'équilibre.",
    score,
    bestPoint,
    biggestTradeoff,
    tips,
  };
}

export function simulateMission(
  modeId: MissionModeId,
  actionIds: readonly ActionId[],
): MissionState {
  const mode = missionModes[modeId] ?? missionModes.france;
  const scenes = scenesForMode(mode);
  let metrics = mode.start;
  const steps: MissionStep[] = [];
  const selectedActions = actionIds.slice(0, MAX_DECISIONS).map(actionById);
  const selectedChoices: CrisisChoice[] = [];

  selectedActions.forEach((action, index) => {
    const sceneValue = scenes[index] ?? scenes[scenes.length - 1];
    const choice = choiceForAction(sceneValue, action.id);
    const event = sceneValue.event ?? mode.events[index] ?? mode.events[mode.events.length - 1];
    selectedChoices.push(choice);
    metrics = applyEffect(metrics, choice.effect);
    metrics = applyEffect(metrics, event.effect);
    const cityStates = simulateCascade(metrics, selectedChoices);
    steps.push({
      decisionNumber: index + 1,
      action,
      choice,
      scene: sceneValue,
      event,
      metrics,
      narration: `${choice.title}. ${event.text}`,
      operatorMessage: operatorMessage(sceneValue, choice, metrics),
      cityStates,
    });
  });

  const cityStates = steps.at(-1)?.cityStates ?? simulateCascade(metrics, selectedChoices);

  const result = resultFromMetrics(metrics, selectedActions);
  const achievements = deriveAchievements(metrics, selectedActions, cityStates);
  const commandPoints = round(result.score + selectedActions.length * 5 + achievements.length * 4 - metrics.blackoutRisk * 0.08);
  const bonusObjectives = deriveBonusObjectives(metrics, selectedActions, cityStates);

  return {
    mode,
    selectedActions,
    metrics,
    steps,
    result,
    decisionsRemaining: Math.max(0, MAX_DECISIONS - selectedActions.length),
    cityStates,
    activeScene: selectedActions.length >= MAX_DECISIONS ? null : scenes[selectedActions.length],
    operatorMessages: steps.map((step) => step.operatorMessage),
    strategyProfile: deriveStrategyProfile(metrics, selectedActions),
    achievements,
    gameRank: deriveGameRank(result.score, metrics),
    commandPoints,
    comboLabel: deriveComboLabel(selectedActions),
    bonusObjectives,
  };
}

export function buildMissionFromSnapshot(snapshot: LiveMixSnapshot | null): string {
  if (!snapshot || snapshot.isFallback) {
    return "Mission générée avec un scénario de démonstration, faute de donnée temps réel exploitable.";
  }

  const consumption = snapshot.consumption
    ? `${new Intl.NumberFormat("fr-FR").format(Math.round(snapshot.consumption))} MW`
    : "une donnée de consommation incomplète";
  const co2 = snapshot.co2Rate === null ? "CO2 non disponible" : `${snapshot.co2Rate} gCO2/kWh`;
  return `Mission ancrée dans le réseau réel: ${consumption}, ${co2}.`;
}

export function buildShareText(state: MissionState): string {
  return [
    `J'ai joué à BLACKOUT et j'ai obtenu ${state.result.score}/100 sur ${state.mode.title}.`,
    `Grade: ${state.gameRank} | XP crise: ${state.commandPoints}`,
    `Profil: ${state.strategyProfile}`,
    `Stabilité: ${state.metrics.stability}`,
    `CO2: ${state.metrics.co2Score}`,
    `Confiance citoyenne: ${state.metrics.citizenTrust}`,
    `Risque blackout: ${state.metrics.blackoutRisk}`,
    "A toi de tenter ta mission.",
  ].join("\n");
}
