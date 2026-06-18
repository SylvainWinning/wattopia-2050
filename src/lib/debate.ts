import type { ScenarioState, SimulationResult } from "./simulation";
import type { DaySimulationSummary } from "./day-simulation";

export type DebateFactionId = "reseau" | "climat" | "industrie" | "territoires";

export type DebateStance = "support" | "conditional" | "concerned" | "opposed";

export type DebateVerdict = "broad-consensus" | "working-coalition" | "fragile-coalition" | "blocked";

export type DebateFactionCard = {
  id: DebateFactionId;
  title: string;
  score: number;
  stance: DebateStance;
  stanceLabel: string;
  message: string;
  priorities: readonly string[];
};

export type DebateFactionCards = readonly [
  DebateFactionCard,
  DebateFactionCard,
  DebateFactionCard,
  DebateFactionCard,
];

export type DebateResult = {
  score: number;
  verdict: DebateVerdict;
  verdictLabel: string;
  coalitionLabel: string;
  message: string;
  cards: DebateFactionCards;
  assumptions: typeof debateAssumptions;
};

export const debateAssumptions = [
  "Scores indicatifs 0-100 calculés à partir des métriques normalisées de Wattopia, pas de précision officielle.",
  "Chaque faction privilégie des critères différents : sécurité réseau, carbone, coût industriel ou acceptabilité territoriale.",
  "Le résumé journalier pèse les tensions horaires pour éviter qu'un bon score moyen masque un pic critique.",
  "Le verdict global mesure la capacité à former une coalition de jeu, pas une position politique réelle.",
] as const;

type DebateMetrics = {
  networkSecurity: number;
  dayStress: number;
  climateScore: number;
  industryScore: number;
  territoryScore: number;
  diversityScore: number;
};

const STANCE_LABELS: Record<DebateStance, string> = {
  support: "Soutien net",
  conditional: "Accord prudent",
  concerned: "À convaincre",
  opposed: "Opposition",
};

const DAY_STATUS_PENALTY: Record<DaySimulationSummary["status"], number> = {
  secure: 0,
  tense: 9,
  critical: 24,
};

const clamp = (value: number, min = 0, max = 100): number => {
  const finiteValue = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, finiteValue));
};

const roundScore = (value: number): number => Math.round(clamp(value));

const positive = (value: number): number => Math.max(0, Number.isFinite(value) ? value : 0);

const weightedScore = (entries: readonly (readonly [value: number, weight: number])[]): number => {
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) return 0;

  const weightedTotal = entries.reduce((sum, [value, weight]) => sum + clamp(value) * weight, 0);
  return roundScore(weightedTotal / totalWeight);
};

function stanceFromScore(score: number): DebateStance {
  if (score >= 78) return "support";
  if (score >= 62) return "conditional";
  if (score >= 45) return "concerned";
  return "opposed";
}

function buildCard(
  id: DebateFactionId,
  title: string,
  score: number,
  message: string,
  priorities: readonly string[],
): DebateFactionCard {
  const stance = stanceFromScore(score);

  return {
    id,
    title,
    score,
    stance,
    stanceLabel: STANCE_LABELS[stance],
    message,
    priorities,
  };
}

function buildMetrics(
  scenario: ScenarioState,
  simulation: SimulationResult,
  day: DaySimulationSummary,
): DebateMetrics {
  const blackoutSafety = clamp(100 - simulation.blackoutRisk);
  const marginSafety = clamp(58 + day.minMargin * 3.4 - day.blackoutHours * 13);
  const dayStress = clamp(
    100 -
      day.maxRisk * 0.58 -
      positive(-day.minMargin) * 4.2 -
      day.blackoutHours * 16 -
      DAY_STATUS_PENALTY[day.status],
  );
  const networkSecurity = weightedScore([
    [simulation.stability, 0.33],
    [simulation.supplyBalance, 0.25],
    [blackoutSafety, 0.22],
    [marginSafety, 0.12],
    [dayStress, 0.08],
  ]);

  const gasPenalty = positive(scenario.gas - 8) * 2.1;
  const climateScore = weightedScore([
    [100 - simulation.emissions, 0.42],
    [simulation.renewableShare, 0.22],
    [clamp(78 + scenario.sobriety * 0.45 - gasPenalty), 0.16],
    [dayStress, 0.1],
    [simulation.score, 0.1],
  ]);

  const costScore = clamp(100 - simulation.cost);
  const continuityScore = weightedScore([
    [simulation.supplyBalance, 0.42],
    [blackoutSafety, 0.3],
    [simulation.stability, 0.18],
    [dayStress, 0.1],
  ]);
  const industryScore = weightedScore([
    [costScore, 0.36],
    [continuityScore, 0.34],
    [clamp(82 - positive(day.blackoutHours) * 18), 0.14],
    [clamp(72 - positive(scenario.sobriety - 34) * 0.7), 0.08],
    [simulation.score, 0.08],
  ]);

  const infrastructureTotal =
    scenario.solar + scenario.wind + scenario.hydro + scenario.nuclear + scenario.gas;
  const largestBlock = Math.max(
    scenario.solar,
    scenario.wind,
    scenario.hydro,
    scenario.nuclear,
    scenario.gas,
  );
  const concentration = infrastructureTotal > 0 ? largestBlock / infrastructureTotal : 1;
  const diversityScore = clamp(
    100 -
      positive(concentration - 0.42) * 155 -
      positive(scenario.solar + scenario.wind - 78) * 0.62 -
      positive(scenario.nuclear - 55) * 0.72 -
      positive(scenario.gas - 15) * 1.35,
  );
  const localFlexibility = clamp(
    40 +
      scenario.sobriety * 0.68 +
      scenario.storage * 0.26 +
      scenario.hydro * 0.45 -
      positive(scenario.solar + scenario.wind - 72) * 0.45 -
      positive(simulation.cost - 64) * 0.4,
  );
  const territoryScore = weightedScore([
    [diversityScore, 0.33],
    [localFlexibility, 0.28],
    [costScore, 0.15],
    [networkSecurity, 0.14],
    [climateScore, 0.1],
  ]);

  return {
    networkSecurity,
    dayStress: roundScore(dayStress),
    climateScore,
    industryScore,
    territoryScore,
    diversityScore: roundScore(diversityScore),
  };
}

function networkMessage(score: number, simulation: SimulationResult, day: DaySimulationSummary): string {
  if (day.blackoutHours > 0) {
    return `Le réseau bloque: ${day.blackoutHours} h en déficit et un risque pic à ${roundScore(day.maxRisk)}.`;
  }
  if (score >= 78) {
    return `Le réseau suit: stabilité ${roundScore(simulation.stability)} et marge journalière sans heure noire.`;
  }
  if (score >= 62) {
    return `Le réseau accepte sous réserve: la marge minimale reste à ${day.minMargin.toFixed(1)}.`;
  }
  return `Le réseau demande plus de marge pilotable avant de valider ce compromis.`;
}

function climateMessage(score: number, simulation: SimulationResult, scenario: ScenarioState): string {
  if (score >= 78) {
    return `Le climat soutient: part bas-carbone élevée et gaz limité à ${roundScore(scenario.gas)}.`;
  }
  if (simulation.emissions >= 55 || scenario.gas >= 18) {
    return `Le climat conteste le gaz de secours et demande une trajectoire plus sobre.`;
  }
  if (score >= 62) {
    return `Le climat peut suivre si les émissions restent contenues et la sobriété progresse.`;
  }
  return `Le climat juge le compromis trop carboné pour emporter l'adhésion.`;
}

function industryMessage(score: number, simulation: SimulationResult, day: DaySimulationSummary): string {
  if (score >= 78) {
    return `L'industrie suit: coût ${roundScore(simulation.cost)} et continuité électrique lisible.`;
  }
  if (simulation.cost >= 72) {
    return `L'industrie freine: le coût du mix dépasse la zone confortable du modèle.`;
  }
  if (day.blackoutHours > 0 || simulation.supplyBalance < 55) {
    return `L'industrie demande une garantie d'alimentation avant d'investir.`;
  }
  return `L'industrie reste négociable, à condition de stabiliser coût et disponibilité.`;
}

function territoryMessage(
  score: number,
  scenario: ScenarioState,
  metrics: Pick<DebateMetrics, "diversityScore">,
): string {
  const variableRenewables = scenario.solar + scenario.wind;

  if (score >= 78) {
    return `Les territoires suivent: le mix paraît diversifié et les efforts sont mieux répartis.`;
  }
  if (variableRenewables >= 78) {
    return `Les territoires demandent de répartir l'effort solaire-éolien et d'expliquer les impacts locaux.`;
  }
  if (metrics.diversityScore < 55) {
    return `Les territoires voient un mix trop concentré et réclament plus de dialogue local.`;
  }
  return `Les territoires peuvent basculer si les bénéfices locaux et les contraintes sont clarifiés.`;
}

function buildVerdict(cards: DebateFactionCards): Pick<
  DebateResult,
  "score" | "verdict" | "verdictLabel" | "coalitionLabel" | "message"
> {
  const globalScore = weightedScore(cards.map((card) => [card.score, 1] as const));
  const supporters = cards.filter((card) => card.score >= 62);
  const opponents = cards.filter((card) => card.score < 45);
  const weakest = cards.reduce((current, card) => (card.score < current.score ? card : current), cards[0]);
  const coalitionNames = supporters.map((card) => card.title).join(" + ");
  const coalitionLabel = coalitionNames ? `Coalition ${coalitionNames}` : "Aucune coalition stable";

  if (globalScore >= 76 && opponents.length === 0 && supporters.length === cards.length) {
    return {
      score: globalScore,
      verdict: "broad-consensus",
      verdictLabel: "Consensus large",
      coalitionLabel,
      message: "Les quatre factions peuvent défendre le compromis sans concession majeure.",
    };
  }

  if (supporters.length >= 3 && opponents.length === 0) {
    return {
      score: globalScore,
      verdict: "working-coalition",
      verdictLabel: "Coalition négociable",
      coalitionLabel,
      message: `${supporters.length} factions sur 4 soutiennent le compromis; ${weakest.title} reste le point de vigilance.`,
    };
  }

  if (supporters.length >= 2 && opponents.length <= 1 && globalScore >= 52) {
    return {
      score: globalScore,
      verdict: "fragile-coalition",
      verdictLabel: "Coalition fragile",
      coalitionLabel,
      message: `La majorité existe, mais ${weakest.title} peut faire basculer le débat.`,
    };
  }

  return {
    score: globalScore,
    verdict: "blocked",
    verdictLabel: "Débat bloqué",
    coalitionLabel,
    message: `Le compromis ne tient pas encore: ${weakest.title} est trop loin du seuil d'accord.`,
  };
}

export function buildGrandDebatEnergetique(
  scenario: ScenarioState,
  simulation: SimulationResult,
  day: DaySimulationSummary,
): DebateResult {
  const metrics = buildMetrics(scenario, simulation, day);
  const cards: DebateFactionCards = [
    buildCard("reseau", "Réseau", metrics.networkSecurity, networkMessage(metrics.networkSecurity, simulation, day), [
      "marge",
      "stabilité",
      "risque blackout",
    ]),
    buildCard("climat", "Climat", metrics.climateScore, climateMessage(metrics.climateScore, simulation, scenario), [
      "émissions",
      "sobriété",
      "gaz",
    ]),
    buildCard("industrie", "Industrie", metrics.industryScore, industryMessage(metrics.industryScore, simulation, day), [
      "coût",
      "continuité",
      "visibilité",
    ]),
    buildCard(
      "territoires",
      "Territoires",
      metrics.territoryScore,
      territoryMessage(metrics.territoryScore, scenario, metrics),
      ["acceptabilité", "répartition", "bénéfices locaux"],
    ),
  ];

  return {
    ...buildVerdict(cards),
    cards,
    assumptions: debateAssumptions,
  };
}
