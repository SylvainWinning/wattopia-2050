export type ChallengeId = "normal" | "nightWindless" | "winterPeak" | "solarDay";

export type ScenarioState = {
  solar: number;
  wind: number;
  hydro: number;
  nuclear: number;
  storage: number;
  sobriety: number;
  gas: number;
  challenge: ChallengeId;
};

export type SimulationResult = {
  score: number;
  verdict: string;
  explanation: string;
  advice: string[];
  renewableShare: number;
  emissions: number;
  stability: number;
  cost: number;
  blackoutRisk: number;
  demandPressure: number;
  supplyBalance: number;
};

export const defaultScenario: ScenarioState = {
  solar: 28,
  wind: 34,
  hydro: 13,
  nuclear: 32,
  storage: 48,
  sobriety: 24,
  gas: 9,
  challenge: "normal",
};

export const challenges: Record<
  ChallengeId,
  {
    label: string;
    short: string;
    description: string;
    solarFactor: number;
    windFactor: number;
    demandFactor: number;
    storageNeed: number;
  }
> = {
  normal: {
    label: "Conditions normales",
    short: "Normal",
    description: "Hypothèse moyenne pour comparer les scénarios.",
    solarFactor: 1,
    windFactor: 1,
    demandFactor: 1,
    storageNeed: 0,
  },
  nightWindless: {
    label: "Nuit sans vent",
    short: "Nuit sans vent",
    description: "Solaire presque nul, éolien fortement réduit.",
    solarFactor: 0.08,
    windFactor: 0.28,
    demandFactor: 1.04,
    storageNeed: 22,
  },
  winterPeak: {
    label: "Pic de consommation hivernal",
    short: "Pic hivernal",
    description: "Demande élevée, marge de sécurité prioritaire.",
    solarFactor: 0.45,
    windFactor: 0.75,
    demandFactor: 1.24,
    storageNeed: 10,
  },
  solarDay: {
    label: "Journée solaire idéale",
    short: "Journée solaire idéale",
    description: "Solaire fort, stockage utile pour la soirée.",
    solarFactor: 1.45,
    windFactor: 0.86,
    demandFactor: 0.96,
    storageNeed: 16,
  },
};

const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number): number => Math.round(value);

function verdictFromScore(score: number): string {
  if (score < 38) return "Blackout probable";
  if (score < 55) return "Réseau fragile";
  if (score < 72) return "Mix équilibré";
  if (score < 88) return "Scénario bas-carbone solide";
  return "Wattopia validée";
}

function buildAdvice(scenario: ScenarioState, result: Omit<SimulationResult, "advice">): string[] {
  const tips: string[] = [];
  const variableRenewables = scenario.solar + scenario.wind;

  if (variableRenewables > 58 && scenario.storage < 55) {
    tips.push("Ajoute du stockage pour compenser l'intermittence du solaire et de l'éolien.");
  }
  if (scenario.gas > 16) {
    tips.push("Réduis le gaz de secours pour améliorer le score carbone.");
  }
  if (scenario.sobriety < 18) {
    tips.push("Ajoute de la sobriété pour réduire la pression sur le réseau.");
  }
  if (scenario.hydro > 22) {
    tips.push("L'hydraulique aide beaucoup, mais son potentiel reste limité en France.");
  }
  if (result.stability < 62) {
    tips.push("Renforce la stabilité avec un socle pilotable, du stockage ou moins de demande.");
  }
  if (result.cost > 72) {
    tips.push("Ton scénario devient coûteux : cherche un meilleur équilibre entre moyens pilotables et flexibilité.");
  }
  if (tips.length === 0) {
    tips.push("Ton scénario est robuste : teste maintenant un pic hivernal ou une nuit sans vent.");
  }

  return tips.slice(0, 3);
}

export function simulateScenario(scenario: ScenarioState): SimulationResult {
  const challenge = challenges[scenario.challenge];
  const effectiveSolar = scenario.solar * challenge.solarFactor;
  const effectiveWind = scenario.wind * challenge.windFactor;
  const effectiveDemand = 100 * challenge.demandFactor * (1 - scenario.sobriety / 180);
  const renewableShare = clamp(effectiveSolar + effectiveWind + scenario.hydro, 0, 100);
  const lowCarbonSupply =
    effectiveSolar * 0.92 + effectiveWind * 0.93 + scenario.hydro * 1.05 + scenario.nuclear * 0.95;
  const backupSupply = scenario.gas * 0.72 + scenario.storage * 0.42;
  const grossSupply = lowCarbonSupply + backupSupply;
  const supplyBalance = clamp(100 - Math.abs(effectiveDemand - grossSupply) * 0.86);

  const intermittency = Math.max(
    0,
    effectiveSolar + effectiveWind - scenario.storage * 0.86 - scenario.hydro * 0.36,
  );
  const storageFit = clamp(scenario.storage - challenge.storageNeed + renewableShare * 0.18);
  const stableBase =
    28 +
    scenario.nuclear * 0.42 +
    scenario.hydro * 0.76 +
    storageFit * 0.34 +
    scenario.gas * 0.22 +
    scenario.sobriety * 0.2 -
    intermittency * 0.52 -
    (challenge.demandFactor - 1) * 45;
  const stability = clamp(stableBase);

  const emissions = clamp(
    15 + scenario.gas * 4.8 + Math.max(0, 28 - scenario.nuclear) * 0.22 - renewableShare * 0.12,
  );
  const carbonScore = clamp(100 - emissions * 0.95);
  const complexity =
    24 +
    scenario.storage * 0.34 +
    Math.max(0, scenario.nuclear - 44) * 1.05 +
    Math.max(0, scenario.solar - 48) * 0.45 +
    Math.max(0, scenario.wind - 52) * 0.38 +
    scenario.gas * 0.18;
  const cost = clamp(complexity);
  const costScore = clamp(100 - cost);
  const renewableScore = clamp(48 + renewableShare * 0.62);
  const blackoutRisk = clamp(
    100 - stability * 0.68 - supplyBalance * 0.26 + Math.max(0, effectiveDemand - grossSupply) * 0.9,
  );
  const score = round(
    stability * 0.29 +
      carbonScore * 0.24 +
      supplyBalance * 0.19 +
      costScore * 0.13 +
      renewableScore * 0.15 -
      blackoutRisk * 0.08,
  );

  const baseResult = {
    score: clamp(score),
    verdict: verdictFromScore(score),
    explanation:
      score >= 72
        ? "Ton mix garde une bonne marge de stabilité tout en restant très bas-carbone. Le scénario absorbe mieux les variations de météo et de demande."
        : score >= 55
          ? "Le système tient dans des conditions moyennes, mais il devient sensible aux pics et aux creux de production. Quelques ajustements peuvent fortement réduire le risque."
          : "La marge de sécurité est trop faible pour ce cas de figure. Le réseau dépend trop d'une production variable ou d'un secours carboné.",
    renewableShare: round(renewableShare),
    emissions: round(emissions),
    stability: round(stability),
    cost: round(cost),
    blackoutRisk: round(blackoutRisk),
    demandPressure: round(clamp(effectiveDemand)),
    supplyBalance: round(supplyBalance),
  };

  return {
    ...baseResult,
    advice: buildAdvice(scenario, baseResult),
  };
}

export function scenarioToParams(scenario: ScenarioState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("solar", String(scenario.solar));
  params.set("wind", String(scenario.wind));
  params.set("hydro", String(scenario.hydro));
  params.set("nuclear", String(scenario.nuclear));
  params.set("storage", String(scenario.storage));
  params.set("sobriety", String(scenario.sobriety));
  params.set("gas", String(scenario.gas));
  if (scenario.challenge !== "normal") params.set("challenge", scenario.challenge);
  return params;
}

export function scenarioFromParams(params: URLSearchParams): ScenarioState {
  const read = (key: keyof Omit<ScenarioState, "challenge">, fallback: number): number => {
    const raw = params.get(key);
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(parsed) ? clamp(parsed) : fallback;
  };
  const challengeParam = params.get("challenge") as ChallengeId | null;
  const challenge = challengeParam && challengeParam in challenges ? challengeParam : "normal";

  return {
    solar: read("solar", defaultScenario.solar),
    wind: read("wind", defaultScenario.wind),
    hydro: read("hydro", defaultScenario.hydro),
    nuclear: read("nuclear", defaultScenario.nuclear),
    storage: read("storage", defaultScenario.storage),
    sobriety: read("sobriety", defaultScenario.sobriety),
    gas: read("gas", defaultScenario.gas),
    challenge,
  };
}
