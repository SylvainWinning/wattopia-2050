import { hasUsableSnapshot, mapEco2MixRecord, type LiveMixSnapshot, withFallbackLabel } from "@/lib/live-mix";

const endpoint = "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/records";
const requestTimeoutMs = 4500;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchCandidateRecords(params: URLSearchParams): Promise<unknown[]> {
  const response = await fetchWithTimeout(`${endpoint}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`ODRÉ a répondu ${response.status}`);
  }

  const payload = (await response.json()) as { results?: unknown[] };
  return payload.results ?? [];
}

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
    let records = await fetchCandidateRecords(params);

    if (!records.length) {
      records = await fetchCandidateRecords(new URLSearchParams({
        order_by: "-date_heure",
        limit: "20",
      }));
    }

    const firstRecord = records.find((record) => {
      if (!record || typeof record !== "object") return false;
      return hasUsableSnapshot(mapEco2MixRecord(record));
    });

    if (!firstRecord || typeof firstRecord !== "object") throw new Error("aucune donnée exploitable");

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
