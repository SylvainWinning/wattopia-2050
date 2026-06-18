import { hasUsableSnapshot, mapEco2MixRecord, type LiveMixSnapshot, withFallbackLabel } from "@/lib/live-mix";

const endpoint = "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/records";

export async function fetchLiveMixSnapshot(forceDemo = false): Promise<LiveMixSnapshot> {
  if (forceDemo) {
    return withFallbackLabel("mode test");
  }

  try {
    const params = new URLSearchParams({
      order_by: "-date_heure",
      limit: "1",
      where: "consommation is not null",
    });
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`ODRÉ a répondu ${response.status}`);
    }

    const payload = (await response.json()) as { results?: unknown[] };
    const firstRecord = payload.results?.[0];

    if (!firstRecord || typeof firstRecord !== "object") {
      throw new Error("aucune donnée exploitable");
    }

    const snapshot = mapEco2MixRecord(firstRecord);
    if (!hasUsableSnapshot(snapshot)) {
      throw new Error("donnée temps réel incomplète");
    }

    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : "API indisponible";
    return withFallbackLabel(message);
  }
}
