export type LiveMixSnapshot = {
  timestamp: string;
  consumption: number | null;
  forecastToday: number | null;
  nuclear: number | null;
  wind: number | null;
  onshoreWind: number | null;
  offshoreWind: number | null;
  solar: number | null;
  hydro: number | null;
  gas: number | null;
  oil: number | null;
  coal: number | null;
  bioenergy: number | null;
  pumping: number | null;
  co2Rate: number | null;
  physicalExchanges: number | null;
  isFallback: boolean;
  sourceLabel: string;
};

type Eco2MixRecord = Partial<{
  date_heure: string;
  consommation: number | null;
  prevision_j: number | null;
  prevision_j1: number | null;
  nucleaire: number | null;
  eolien: number | null;
  eolien_terrestre: number | null;
  eolien_offshore: number | null;
  solaire: number | null;
  hydraulique: number | null;
  gaz: number | null;
  fioul: number | null;
  charbon: number | null;
  bioenergies: number | null;
  pompage: number | null;
  taux_co2: number | null;
  ech_physiques: number | null;
}>;

const numberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const fallbackSnapshot: LiveMixSnapshot = {
  timestamp: "2026-06-17T21:30:00+00:00",
  consumption: 47690,
  forecastToday: 47900,
  nuclear: 43636,
  wind: 1741,
  onshoreWind: 1644,
  offshoreWind: 98,
  solar: 0,
  hydro: 8570,
  gas: 3295,
  oil: 35,
  coal: 0,
  bioenergy: 1017,
  pumping: -84,
  co2Rate: 33,
  physicalExchanges: -10529,
  isFallback: true,
  sourceLabel: "Données de démonstration",
};

export function mapEco2MixRecord(record: Eco2MixRecord): LiveMixSnapshot {
  return {
    timestamp: record.date_heure ?? fallbackSnapshot.timestamp,
    consumption: numberOrNull(record.consommation),
    forecastToday: numberOrNull(record.prevision_j ?? record.prevision_j1),
    nuclear: numberOrNull(record.nucleaire),
    wind: numberOrNull(record.eolien),
    onshoreWind: numberOrNull(record.eolien_terrestre),
    offshoreWind: numberOrNull(record.eolien_offshore),
    solar: numberOrNull(record.solaire),
    hydro: numberOrNull(record.hydraulique),
    gas: numberOrNull(record.gaz),
    oil: numberOrNull(record.fioul),
    coal: numberOrNull(record.charbon),
    bioenergy: numberOrNull(record.bioenergies),
    pumping: numberOrNull(record.pompage),
    co2Rate: numberOrNull(record.taux_co2),
    physicalExchanges: numberOrNull(record.ech_physiques),
    isFallback: false,
    sourceLabel: "RTE éCO2mix temps réel",
  };
}

export function hasUsableSnapshot(snapshot: LiveMixSnapshot): boolean {
  return snapshot.consumption !== null && snapshot.nuclear !== null;
}

export function withFallbackLabel(reason?: string): LiveMixSnapshot {
  return {
    ...fallbackSnapshot,
    sourceLabel: reason
      ? `Données de démonstration - ${reason}`
      : fallbackSnapshot.sourceLabel,
  };
}
