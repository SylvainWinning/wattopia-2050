import type { LiveMixSnapshot } from "./live-mix";

export const MAX_DECISIONS = 5;

export type MissionModeId = "france" | "paris" | "future2050";

export type CityState = "on" | "fragile" | "off";

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
};

export type ActionId =
  | "batteries"
  | "gas"
  | "domestic"
  | "imports"
  | "priority"
  | "industry"
  | "sobriety"
  | "hydro";

export type MissionAction = {
  id: ActionId;
  title: string;
  shortTitle: string;
  icon: "battery" | "flame" | "home" | "import" | "shield" | "factory" | "megaphone" | "waves";
  description: string;
  tradeoff: string;
  effect: MetricEffect;
};

export type MissionStep = {
  decisionNumber: number;
  action: MissionAction;
  event: MissionEvent;
  metrics: MissionMetrics;
  narration: string;
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

export type MissionState = {
  mode: MissionMode;
  selectedActions: MissionAction[];
  metrics: MissionMetrics;
  steps: MissionStep[];
  result: MissionResult;
  decisionsRemaining: number;
};

export type GridCity = {
  id: string;
  name: string;
  x: number;
  y: number;
  threshold: number;
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
  { id: "lille", name: "Lille", x: 49, y: 14, threshold: 54 },
  { id: "paris", name: "Paris", x: 45, y: 28, threshold: 40 },
  { id: "strasbourg", name: "Strasbourg", x: 72, y: 32, threshold: 64 },
  { id: "nantes", name: "Nantes", x: 27, y: 43, threshold: 60 },
  { id: "bordeaux", name: "Bordeaux", x: 31, y: 66, threshold: 58 },
  { id: "lyon", name: "Lyon", x: 60, y: 58, threshold: 48 },
  { id: "toulouse", name: "Toulouse", x: 43, y: 78, threshold: 62 },
  { id: "marseille", name: "Marseille", x: 62, y: 82, threshold: 56 },
];

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
];

export function actionById(actionId: ActionId): MissionAction {
  const action = missionActions.find((candidate) => candidate.id === actionId);
  if (!action) throw new Error(`Action inconnue: ${actionId}`);
  return action;
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
  let metrics = mode.start;
  const steps: MissionStep[] = [];
  const selectedActions = actionIds.slice(0, MAX_DECISIONS).map(actionById);

  selectedActions.forEach((action, index) => {
    const event = mode.events[index] ?? mode.events[mode.events.length - 1];
    metrics = applyEffect(metrics, action.effect);
    metrics = applyEffect(metrics, event.effect);
    steps.push({
      decisionNumber: index + 1,
      action,
      event,
      metrics,
      narration: `${action.shortTitle} choisi. ${event.text}`,
    });
  });

  return {
    mode,
    selectedActions,
    metrics,
    steps,
    result: resultFromMetrics(metrics, selectedActions),
    decisionsRemaining: Math.max(0, MAX_DECISIONS - selectedActions.length),
  };
}

export function getCityState(metrics: MissionMetrics, city: GridCity): CityState {
  const pressure = metrics.lightsOn - city.threshold - metrics.blackoutRisk * 0.22 + metrics.stability * 0.08;
  if (pressure >= 2) return "on";
  if (pressure >= -16) return "fragile";
  return "off";
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
    `Stabilité: ${state.metrics.stability}`,
    `CO2: ${state.metrics.co2Score}`,
    `Confiance citoyenne: ${state.metrics.citizenTrust}`,
    `Risque blackout: ${state.metrics.blackoutRisk}`,
    "A toi de tenter ta mission.",
  ].join("\n");
}
