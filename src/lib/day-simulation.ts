import { challenges, type ScenarioState } from "./simulation";

export type DaySimulationPoint = {
  hour: number;
  label: string;
  demand: number;
  supply: number;
  renewable: number;
  nuclear: number;
  storage: number;
  gas: number;
  margin: number;
  blackoutRisk: number;
  storageLevel: number;
  eventLabel?: string;
};

export type DaySimulationStatus = "secure" | "tense" | "critical";

export type DaySimulationSummary = {
  minMargin: number;
  maxRisk: number;
  blackoutHours: number;
  finalStorage: number;
  status: DaySimulationStatus;
  bestHour: DaySimulationPoint;
  worstHour: DaySimulationPoint;
};

export type DaySimulationOptions = {
  initialStorage?: number;
};

export type DaySimulationResult = {
  hours: DaySimulationPoint[];
  summary: DaySimulationSummary;
};

export const daySimulationAssumptions = [
  "Normalized power index, not official MW or GW.",
  "Demand follows a typical morning/evening daily profile and is reduced by sobriety.",
  "Solar, wind and demand are adjusted by the selected challenge.",
  "Storage is a simplified battery/flexibility buffer with charge losses.",
  "Gas is dispatched only after renewables, nuclear and storage.",
] as const;

const HOURS_PER_DAY = 24;
const STORAGE_ROUND_TRIP_EFFICIENCY = 0.9;

const EMPTY_DAY_POINT: DaySimulationPoint = {
  hour: 0,
  label: "00h",
  demand: 0,
  supply: 0,
  renewable: 0,
  nuclear: 0,
  storage: 0,
  gas: 0,
  margin: 0,
  blackoutRisk: 0,
  storageLevel: 0,
};

const DEMAND_PROFILE = [
  0.78, 0.74, 0.72, 0.71, 0.73, 0.8, 0.92, 1.03, 1.08, 1.02, 0.97, 0.95,
  0.96, 0.98, 0.99, 1.01, 1.06, 1.15, 1.22, 1.2, 1.11, 1.02, 0.92, 0.84,
] as const;

const SOLAR_PROFILE = [
  0, 0, 0, 0, 0, 0.04, 0.16, 0.36, 0.58, 0.78, 0.94, 1.04, 1.08, 1.03, 0.9,
  0.7, 0.46, 0.2, 0.05, 0, 0, 0, 0, 0,
] as const;

const WIND_PROFILE = [
  0.98, 0.94, 0.91, 0.9, 0.92, 0.95, 0.99, 1.02, 1.03, 1, 0.95, 0.9, 0.87,
  0.86, 0.88, 0.92, 0.97, 1.04, 1.1, 1.13, 1.11, 1.08, 1.04, 1.01,
] as const;

const HYDRO_PROFILE = [
  0.88, 0.86, 0.84, 0.84, 0.86, 0.92, 1.02, 1.1, 1.12, 1.04, 0.98, 0.96,
  0.96, 0.98, 1.0, 1.04, 1.1, 1.16, 1.18, 1.15, 1.08, 1.0, 0.94, 0.9,
] as const;

const NUCLEAR_PROFILE = [
  1, 1, 1, 1, 1, 1, 0.99, 0.99, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98,
  0.99, 0.99, 1, 1, 1, 1, 1, 1, 1,
] as const;

const clamp = (value: number, min = 0, max = 100): number => {
  const finiteValue = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, finiteValue));
};

const round = (value: number): number => Math.round(value * 10) / 10;

const profileAt = (profile: readonly number[], hour: number): number => profile[hour] ?? 1;

const normalizedScenario = (scenario: ScenarioState): ScenarioState => ({
  solar: clamp(scenario.solar),
  wind: clamp(scenario.wind),
  hydro: clamp(scenario.hydro),
  nuclear: clamp(scenario.nuclear),
  storage: clamp(scenario.storage),
  sobriety: clamp(scenario.sobriety),
  gas: clamp(scenario.gas),
  challenge: scenario.challenge in challenges ? scenario.challenge : "normal",
});

function getEventLabel(hour: number, point: Omit<DaySimulationPoint, "eventLabel">): string | undefined {
  if (point.margin < -0.5) return "Marge negative";
  if (point.blackoutRisk >= 70) return "Risque eleve";
  if (point.storage > 4) return "Stockage sollicite";
  if (point.storage < -4) return "Recharge stockage";
  if (hour === 8) return "Pic du matin";
  if (hour === 18 || hour === 19) return "Pic du soir";
  if (hour === 12 && point.renewable > point.nuclear * 1.4) return "Pointe solaire";
  return undefined;
}

function statusFromSummary(
  minMargin: number,
  maxRisk: number,
  blackoutHours: number,
): DaySimulationStatus {
  if (blackoutHours > 0 || minMargin < -0.5 || maxRisk >= 70) return "critical";
  if (minMargin < 4 || maxRisk >= 45) return "tense";
  return "secure";
}

export function simulateDaySimulation(
  scenario: ScenarioState,
  options: DaySimulationOptions = {},
): DaySimulationPoint[] {
  const normalized = normalizedScenario(scenario);
  const challenge = challenges[normalized.challenge];
  const sobrietyFactor = 1 - normalized.sobriety / 180;
  const storageCapacity = 32 + normalized.storage * 2.2;
  const initialStorage = clamp(
    options.initialStorage ?? 52 + normalized.storage * 0.28 - challenge.storageNeed * 0.7,
    5,
    95,
  );
  const storagePowerLimit = 5 + normalized.storage * 0.36;
  const gasPowerLimit = normalized.gas * 0.95;
  let storedEnergy = storageCapacity * (initialStorage / 100);

  return Array.from({ length: HOURS_PER_DAY }, (_, hour) => {
    const demand = 100 * profileAt(DEMAND_PROFILE, hour) * challenge.demandFactor * sobrietyFactor;
    const solar =
      normalized.solar * 1.15 * challenge.solarFactor * profileAt(SOLAR_PROFILE, hour);
    const wind = normalized.wind * 0.88 * challenge.windFactor * profileAt(WIND_PROFILE, hour);
    const hydro = normalized.hydro * 0.9 * profileAt(HYDRO_PROFILE, hour);
    const renewable = solar + wind + hydro;
    const nuclear = normalized.nuclear * 0.9 * profileAt(NUCLEAR_PROFILE, hour);
    const baseSupply = renewable + nuclear;
    const baseMargin = baseSupply - demand;
    const remainingStorageCapacity = Math.max(0, storageCapacity - storedEnergy);

    let storage = 0;
    if (baseMargin >= 0) {
      const charge = Math.min(baseMargin * 0.65, storagePowerLimit, remainingStorageCapacity);
      storage = -charge;
      storedEnergy += charge * STORAGE_ROUND_TRIP_EFFICIENCY;
    } else {
      const discharge = Math.min(-baseMargin, storagePowerLimit, storedEnergy);
      storage = discharge;
      storedEnergy -= discharge;
    }

    const supplyBeforeGas = baseSupply + storage;
    const gas = Math.min(Math.max(0, demand - supplyBeforeGas), gasPowerLimit);
    const supply = supplyBeforeGas + gas;
    const margin = supply - demand;
    const storageLevel = storageCapacity === 0 ? 0 : (storedEnergy / storageCapacity) * 100;
    const reserveMargin = demand === 0 ? 100 : (margin / demand) * 100;
    const unmetDemand = Math.max(0, -margin);
    const blackoutRisk = clamp(
      8 +
        unmetDemand * 7 +
        Math.max(0, 8 - reserveMargin) * 2.4 +
        Math.max(0, 30 - storageLevel) * 0.35 +
        challenge.storageNeed * 0.35 -
        normalized.gas * 0.18,
    );

    const point: Omit<DaySimulationPoint, "eventLabel"> = {
      hour,
      label: `${String(hour).padStart(2, "0")}h`,
      demand: round(demand),
      supply: round(supply),
      renewable: round(renewable),
      nuclear: round(nuclear),
      storage: round(storage),
      gas: round(gas),
      margin: round(margin),
      blackoutRisk: round(blackoutRisk),
      storageLevel: round(storageLevel),
    };
    const eventLabel = getEventLabel(hour, point);

    return eventLabel ? { ...point, eventLabel } : point;
  });
}

export function summarizeDaySimulation(
  hours: readonly DaySimulationPoint[],
): DaySimulationSummary {
  const firstHour = hours[0];
  if (!firstHour) {
    return {
      minMargin: 0,
      maxRisk: 0,
      blackoutHours: 0,
      finalStorage: 0,
      status: "secure",
      bestHour: EMPTY_DAY_POINT,
      worstHour: EMPTY_DAY_POINT,
    };
  }

  let minMargin = firstHour.margin;
  let maxRisk = firstHour.blackoutRisk;
  let blackoutHours = 0;
  let bestHour = firstHour;
  let worstHour = firstHour;

  for (const hour of hours) {
    if (hour.margin < minMargin) minMargin = hour.margin;
    if (hour.blackoutRisk > maxRisk) maxRisk = hour.blackoutRisk;
    if (hour.margin < -0.5) blackoutHours += 1;
    if (hour.margin > bestHour.margin) bestHour = hour;
    if (
      hour.blackoutRisk > worstHour.blackoutRisk ||
      (hour.blackoutRisk === worstHour.blackoutRisk && hour.margin < worstHour.margin)
    ) {
      worstHour = hour;
    }
  }

  return {
    minMargin: round(minMargin),
    maxRisk: round(maxRisk),
    blackoutHours,
    finalStorage: round(hours[hours.length - 1]?.storageLevel ?? 0),
    status: statusFromSummary(minMargin, maxRisk, blackoutHours),
    bestHour,
    worstHour,
  };
}

export const buildDaySimulation = simulateDaySimulation;

export function runDaySimulation(
  scenario: ScenarioState,
  options: DaySimulationOptions = {},
): DaySimulationResult {
  const hours = simulateDaySimulation(scenario, options);

  return {
    hours,
    summary: summarizeDaySimulation(hours),
  };
}
