"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Cable,
  ChevronDown,
  CloudSun,
  Copy,
  Download,
  Factory,
  Flame,
  Gauge,
  Leaf,
  Lightbulb,
  Loader2,
  MapPinned,
  Pause,
  Play,
  RadioTower,
  RefreshCw,
  Share2,
  ShieldCheck,
  Snowflake,
  SunMedium,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { buildDaySimulation, summarizeDaySimulation, type DaySimulationPoint } from "@/lib/day-simulation";
import { fetchLiveMixSnapshot } from "@/lib/fetch-live-mix";
import type { LiveMixSnapshot } from "@/lib/live-mix";
import {
  type ChallengeId,
  type SimulationResult,
  type ScenarioState,
  challenges,
  defaultScenario,
  scenarioFromParams,
  scenarioToParams,
  simulateScenario,
} from "@/lib/simulation";

const energyColors = {
  nuclear: "oklch(0.55 0.17 292)",
  wind: "oklch(0.72 0.12 218)",
  solar: "oklch(0.78 0.17 82)",
  hydro: "oklch(0.55 0.16 240)",
  gas: "oklch(0.67 0.16 48)",
  fossil: "oklch(0.55 0.18 28)",
  bio: "oklch(0.62 0.14 145)",
};

const challengeIcons: Record<ChallengeId, LucideIcon> = {
  normal: ShieldCheck,
  nightWindless: Wind,
  winterPeak: Snowflake,
  solarDay: SunMedium,
  coldWave: AlertTriangle,
  reactorOutage: Factory,
  importLimit: MapPinned,
};

const formatMw = (value: number | null): string =>
  value === null ? "n.d." : `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} MW`;

const formatCompact = (value: number | null): string =>
  value === null
    ? "n.d."
    : Math.abs(value) >= 1000
      ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value / 1000)} GW`
      : `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} MW`;

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));

const sharePalette = {
  ink: "#111827",
  muted: "#64748b",
  panel: "#ffffff",
  primary: "#3f46a8",
  solar: "#f6c443",
  wind: "#5ab8df",
  hydro: "#316fd1",
  nuclear: "#7c4fd6",
  storage: "#1aa49a",
  gas: "#df8a2f",
  danger: "#c64535",
  green: "#2c9b5f",
};

const escapeXml = (value: string | number): string =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

function buildScenarioCardSvg(
  scenario: ScenarioState,
  result: SimulationResult,
  summary: ReturnType<typeof summarizeDaySimulation>,
) {
  const challenge = challenges[scenario.challenge];
  const mix = [
    { label: "Solaire", value: scenario.solar, color: sharePalette.solar },
    { label: "Éolien", value: scenario.wind, color: sharePalette.wind },
    { label: "Hydraulique", value: scenario.hydro, color: sharePalette.hydro },
    { label: "Nucléaire", value: scenario.nuclear, color: sharePalette.nuclear },
    { label: "Stockage", value: scenario.storage, color: sharePalette.storage },
    { label: "Gaz", value: scenario.gas, color: sharePalette.gas },
  ];
  const statusColor = summary.status === "secure" ? sharePalette.green : summary.status === "tense" ? sharePalette.gas : sharePalette.danger;
  const barRows = mix.map((item, index) => {
    const y = 304 + index * 42;
    const width = Math.max(8, Math.min(100, item.value) * 2.2);

    return `
      <text x="724" y="${y + 14}" fill="${sharePalette.muted}" font-size="20" font-weight="700">${escapeXml(item.label)}</text>
      <rect x="860" y="${y}" width="230" height="18" rx="9" fill="#e7ebf2" />
      <rect x="860" y="${y}" width="${width}" height="18" rx="9" fill="${item.color}" />
      <text x="1120" y="${y + 15}" fill="${sharePalette.ink}" font-size="19" font-weight="800" text-anchor="end">${item.value}</text>
    `;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#12182d"/>
        <stop offset="48%" stop-color="#232a61"/>
        <stop offset="100%" stop-color="#101421"/>
      </linearGradient>
      <linearGradient id="score" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6bc2ea"/>
        <stop offset="55%" stop-color="#7c4fd6"/>
        <stop offset="100%" stop-color="#f6c443"/>
      </linearGradient>
      <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
        <path d="M 42 0 L 0 0 0 42" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)" />
    <rect width="1200" height="630" fill="url(#grid)" opacity="0.72" />
    <circle cx="1036" cy="94" r="210" fill="#f6c443" opacity="0.13" />
    <circle cx="214" cy="526" r="240" fill="#5ab8df" opacity="0.12" />

    <rect x="54" y="48" width="1092" height="534" rx="30" fill="rgba(255,255,255,0.94)" />
    <rect x="82" y="76" width="442" height="478" rx="24" fill="#111827" />
    <path d="M183 360 C253 292 301 236 375 210 C437 188 469 226 506 281" fill="none" stroke="url(#score)" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 15"/>
    <path d="M152 225 C232 242 304 274 399 260 C448 252 479 226 515 196" fill="none" stroke="#6bc2ea" stroke-width="5" stroke-linecap="round" opacity="0.72"/>
    <path d="M286 132 401 154 464 218 440 329 480 405 388 462 290 438 200 463 145 380 176 296 138 222 208 158Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.42)" stroke-width="2"/>
    <circle cx="207" cy="159" r="${12 + scenario.wind * 0.11}" fill="${sharePalette.wind}" />
    <circle cx="402" cy="154" r="${12 + scenario.nuclear * 0.1}" fill="${sharePalette.nuclear}" />
    <circle cx="463" cy="320" r="${12 + scenario.solar * 0.12}" fill="${sharePalette.solar}" />
    <circle cx="290" cy="438" r="${12 + scenario.hydro * 0.25}" fill="${sharePalette.hydro}" />
    <circle cx="366" cy="345" r="${12 + scenario.storage * 0.1}" fill="${sharePalette.storage}" />
    <text x="112" y="128" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="800">Wattopia 2050</text>
    <text x="112" y="164" fill="rgba(255,255,255,0.72)" font-family="Arial, sans-serif" font-size="17" font-weight="600">Peux-tu alimenter la France sans blackout ?</text>
    <rect x="112" y="482" width="318" height="42" rx="21" fill="rgba(255,255,255,0.12)" />
    <text x="132" y="509" fill="white" font-family="Arial, sans-serif" font-size="17" font-weight="800">${escapeXml(challenge.label)}</text>

    <text x="590" y="118" fill="${sharePalette.muted}" font-family="Arial, sans-serif" font-size="22" font-weight="800">CARTE DU SCÉNARIO</text>
    <text x="590" y="176" fill="${sharePalette.ink}" font-family="Arial, sans-serif" font-size="46" font-weight="900">${escapeXml(result.verdict)}</text>
    <text x="590" y="216" fill="${sharePalette.muted}" font-family="Arial, sans-serif" font-size="20" font-weight="600">Stress test 24h · modèle simplifié pour hackathon</text>

    <circle cx="662" cy="376" r="116" fill="url(#score)" />
    <circle cx="662" cy="376" r="88" fill="white" />
    <text x="662" y="372" fill="${sharePalette.primary}" font-family="Arial, sans-serif" font-size="74" font-weight="900" text-anchor="middle">${result.score}</text>
    <text x="662" y="414" fill="${sharePalette.muted}" font-family="Arial, sans-serif" font-size="24" font-weight="800" text-anchor="middle">/100</text>

    <rect x="724" y="254" width="396" height="280" rx="20" fill="#f7f8fb" />
    <text x="724" y="226" fill="${sharePalette.ink}" font-family="Arial, sans-serif" font-size="23" font-weight="900">Mix choisi</text>
    ${barRows}

    <rect x="590" y="510" width="96" height="12" rx="6" fill="${statusColor}" />
    <text x="590" y="552" fill="${sharePalette.ink}" font-family="Arial, sans-serif" font-size="22" font-weight="900">${summary.blackoutHours} h critiques · marge min. ${summary.minMargin >= 0 ? "+" : ""}${summary.minMargin} · risque max ${summary.maxRisk}%</text>
    <text x="590" y="580" fill="${sharePalette.muted}" font-family="Arial, sans-serif" font-size="16" font-weight="700">sylvainwinning.github.io/wattopia-2050</text>
  </svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 800);
}

async function downloadScenarioCardImage(
  scenario: ScenarioState,
  result: SimulationResult,
  summary: ReturnType<typeof summarizeDaySimulation>,
) {
  const svg = buildScenarioCardSvg(scenario, result, summary);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const imageUrl = URL.createObjectURL(svgBlob);
  const image = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image non générée"));
  });

  image.src = imageUrl;
  try {
    await loaded;
  } catch {
    URL.revokeObjectURL(imageUrl);
    downloadBlob(svgBlob, "wattopia-2050-scenario.svg");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");

  if (!context) {
    URL.revokeObjectURL(imageUrl);
    downloadBlob(svgBlob, "wattopia-2050-scenario.svg");
    return;
  }

  context.drawImage(image, 0, 0);
  URL.revokeObjectURL(imageUrl);

  const pngBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.94);
  });

  downloadBlob(pngBlob ?? svgBlob, pngBlob ? "wattopia-2050-scenario.png" : "wattopia-2050-scenario.svg");
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{value}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px]" style={{ background: tone, color: "white" }}>
          <Icon size={19} strokeWidth={2.2} />
        </span>
      </div>
      {detail ? <p className="mt-3 text-sm leading-5 text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

function MixDonut({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const segments = data.map((item, index) => {
    const start = data.slice(0, index).reduce((sum, previous) => sum + previous.value, 0);
    const length = (item.value / total) * circumference;
    return {
      ...item,
      dashOffset: -(start / total) * circumference,
      length,
    };
  });

  return (
    <div className="mix-donut" aria-label="Graphique du mix actuel">
      <svg viewBox="0 0 120 120" role="img">
        <circle className="donut-track" cx="60" cy="60" r={radius} />
        {segments.map((item) => (
          <circle
            className="donut-segment"
            cx="60"
            cy="60"
            key={item.name}
            r={radius}
            stroke={item.color}
            strokeDasharray={`${item.length} ${circumference - item.length}`}
            strokeDashoffset={item.dashOffset}
          />
        ))}
      </svg>
      <div className="donut-center">
        <strong>{Math.round(total / 1000)}</strong>
        <span>GW produits</span>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as CSSProperties}>
      <div className="score-ring-inner">
        <span>{score}</span>
        <small>/100</small>
      </div>
    </div>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="meter">
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-[var(--ink)]">{label}</span>
        <span className="font-semibold text-[var(--ink)]">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[oklch(0.93_0.012_260)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: tone }}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function SliderControl({
  label,
  icon: Icon,
  value,
  min = 0,
  max = 100,
  helper,
  accent,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  min?: number;
  max?: number;
  helper: string;
  accent: string;
  onChange: (value: number) => void;
}) {
  const commitValue = (event: FormEvent<HTMLInputElement>) => {
    onChange(Number(event.currentTarget.value));
  };

  return (
    <label className="slider-row">
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white text-[var(--primary)] shadow-[inset_0_0_0_1px_var(--line)]">
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-[var(--ink)]">{label}</span>
          <span className="block truncate text-xs text-[var(--muted)]">{helper}</span>
        </span>
      </span>
      <span className="flex items-center gap-4">
        <input
          className="range"
          type="range"
          min={min}
          max={max}
          value={value}
          aria-label={label}
          aria-valuetext={`${value} sur ${max}`}
          style={{ "--range-color": accent } as CSSProperties}
          onChange={commitValue}
          onInput={commitValue}
        />
        <span className="w-12 text-right font-mono text-sm font-semibold text-[var(--ink)]">{value}</span>
      </span>
    </label>
  );
}

function EnergyMap() {
  return (
    <div className="energy-map" aria-hidden="true">
      <svg viewBox="0 0 760 560" role="img">
        <defs>
          <linearGradient id="gridLine" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.12 218)" />
            <stop offset="50%" stopColor="oklch(0.45 0.15 260)" />
            <stop offset="100%" stopColor="oklch(0.78 0.17 82)" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="map-shape"
          d="M337 73 461 95 533 171 594 229 569 331 611 402 502 466 399 487 302 452 203 466 143 383 182 289 143 211 220 142Z"
        />
        <path className="flow-line flow-one" d="M194 391 C268 337 294 253 377 221 C465 187 514 235 575 299" />
        <path className="flow-line flow-two" d="M212 153 C284 214 356 258 413 339 C449 391 502 417 560 421" />
        <path className="flow-line flow-three" d="M302 451 C327 363 309 279 365 205 C402 155 449 126 516 128" />
        <path className="flow-line flow-four" d="M164 260 C258 267 344 296 444 278 C506 266 542 231 587 204" />
        {[
          [220, 142, "wind"],
          [461, 95, "nuclear"],
          [575, 299, "solar"],
          [302, 452, "hydro"],
          [413, 339, "storage"],
          [182, 289, "city"],
          [533, 171, "gas"],
        ].map(([x, y, kind], index) => (
          <g className={clsx("node", `node-${kind}`)} key={`${kind}-${index}`} transform={`translate(${x} ${y})`}>
            <circle r="18" />
            <circle r="5" />
          </g>
        ))}
        <g className="city" transform="translate(295 398)">
          <rect x="0" y="22" width="22" height="48" rx="5" />
          <rect x="32" y="0" width="28" height="70" rx="6" />
          <rect x="72" y="14" width="20" height="56" rx="5" />
          <rect x="106" y="30" width="34" height="40" rx="6" />
        </g>
      </svg>
      <div className="map-caption">
        <RadioTower size={17} />
        <span>Réseau 2050 : équilibre, flexibilité, pilotage</span>
      </div>
    </div>
  );
}

function MissionBrief() {
  return (
    <section id="mission" className="section-shell mission-brief" aria-labelledby="mission-title">
      <div className="mission-copy">
        <p className="scenario-label">Le défi</p>
        <h2 id="mission-title">Garde les lumières allumées en France, toute une journée de 2050.</h2>
        <p>
          Wattopia part du mix électrique réel d’aujourd’hui, puis te met aux commandes d’un scénario 2050. Le but : obtenir un bon score, limiter le CO₂ et éviter les heures critiques.
        </p>
      </div>
      <div className="mission-steps" aria-label="Étapes du défi">
        <article>
          <span>
            <Gauge size={19} />
          </span>
          <strong>Observe le réseau actuel</strong>
          <p>Consommation, nucléaire, éolien, solaire, hydraulique, gaz et CO₂ viennent des données RTE éCO2mix.</p>
        </article>
        <article>
          <span>
            <Cable size={19} />
          </span>
          <strong>Construis ton mix 2050</strong>
          <p>Ajuste les curseurs : plus de renouvelables, plus de stockage, plus de sobriété, ou un socle pilotable plus fort.</p>
        </article>
        <article>
          <span>
            <AlertTriangle size={19} />
          </span>
          <strong>Teste les moments difficiles</strong>
          <p>Nuit sans vent, pic hivernal, vague de froid : si la marge devient négative, le risque de blackout grimpe.</p>
        </article>
      </div>
    </section>
  );
}

function LiveMixSection({
  snapshot,
  loading,
  onRefresh,
}: {
  snapshot: LiveMixSnapshot | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const chartData = useMemo(() => {
    if (!snapshot) return [];
    return [
      { name: "Nucléaire", value: snapshot.nuclear ?? 0, color: energyColors.nuclear },
      { name: "Éolien", value: snapshot.wind ?? 0, color: energyColors.wind },
      { name: "Solaire", value: snapshot.solar ?? 0, color: energyColors.solar },
      { name: "Hydraulique", value: snapshot.hydro ?? 0, color: energyColors.hydro },
      { name: "Gaz", value: snapshot.gas ?? 0, color: energyColors.gas },
      { name: "Fossile", value: (snapshot.coal ?? 0) + (snapshot.oil ?? 0), color: energyColors.fossil },
      { name: "Bioénergies", value: snapshot.bioenergy ?? 0, color: energyColors.bio },
    ].filter((item) => item.value > 0);
  }, [snapshot]);

  return (
    <section id="maintenant" className="section-shell">
      <div className="section-heading">
        <div>
          <h2>La France maintenant</h2>
          <p>
            Un instantané du mix électrique national issu de RTE éCO2mix. Si l’API est indisponible, Wattopia bascule sur un exemple réaliste.
          </p>
        </div>
        <button className="ghost-button" onClick={onRefresh} type="button">
          {loading ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
          Actualiser
        </button>
      </div>

      <div className="live-grid">
        <div className="live-cards">
          <MetricCard label="Consommation" value={formatMw(snapshot?.consumption ?? null)} detail="Demande instantanée nationale" icon={Gauge} tone="var(--primary)" />
          <MetricCard label="Nucléaire" value={formatCompact(snapshot?.nuclear ?? null)} detail="Production pilotable bas-carbone" icon={Factory} tone={energyColors.nuclear} />
          <MetricCard label="Éolien" value={formatCompact(snapshot?.wind ?? null)} detail="Terrestre + offshore si disponible" icon={Wind} tone={energyColors.wind} />
          <MetricCard label="Solaire" value={formatCompact(snapshot?.solar ?? null)} detail="Production photovoltaïque" icon={SunMedium} tone={energyColors.solar} />
          <MetricCard label="Hydraulique" value={formatCompact(snapshot?.hydro ?? null)} detail="Fil de l'eau, lacs et STEP turbinage" icon={Waves} tone={energyColors.hydro} />
          <MetricCard label="Gaz" value={formatCompact(snapshot?.gas ?? null)} detail="Appui thermique flexible" icon={Flame} tone={energyColors.gas} />
        </div>

        <div className="chart-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3>Mix actuel</h3>
              <p>{snapshot ? formatDate(snapshot.timestamp) : "Chargement..."}</p>
            </div>
            <span className={clsx("data-pill", snapshot?.isFallback && "fallback")}>
              {snapshot?.sourceLabel ?? "Connexion aux données..."}
            </span>
          </div>
          <div className="h-[284px] min-h-0">
            <MixDonut data={chartData} />
          </div>
          <div className="legend-grid">
            {chartData.map((entry) => (
              <span key={entry.name}>
                <i style={{ background: entry.color }} />
                {entry.name}
              </span>
            ))}
          </div>
          <div className="co2-strip">
            <Leaf size={18} />
            <span>
              CO₂ estimé : <strong>{snapshot?.co2Rate ?? "n.d."} g/kWh</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlStat({
  label,
  value,
  detail,
  tone = "var(--primary)",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="control-stat">
      <span>{label}</span>
      <strong style={{ color: tone }}>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function DayTimeline({
  points,
  activeHour,
}: {
  points: DaySimulationPoint[];
  activeHour: number;
}) {
  const maxValue = Math.max(...points.flatMap((point) => [point.demand, point.supply]), 100);
  const chartWidth = 720;
  const chartHeight = 238;
  const xFor = (hour: number) => (hour / 23) * chartWidth;
  const yFor = (value: number) => chartHeight - (value / maxValue) * (chartHeight - 22) - 10;
  const pathFor = (key: "demand" | "supply") =>
    points.map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(point.hour).toFixed(1)} ${yFor(point[key]).toFixed(1)}`).join(" ");
  const marginBars = points.map((point) => {
    const x = xFor(point.hour) - 5;
    const zero = yFor(point.demand);
    const supply = yFor(point.supply);
    return {
      ...point,
      x,
      y: Math.min(zero, supply),
      height: Math.max(3, Math.abs(zero - supply)),
      danger: point.margin < 0,
    };
  });
  const activePoint = points[activeHour] ?? points[0];

  return (
    <div className="timeline-panel">
      <div className="timeline-head">
        <div>
          <h3>Simulation 24h accélérée</h3>
          <p>Demande, production et marge réseau heure par heure.</p>
        </div>
        <div className={clsx("hour-badge", activePoint.margin < 0 && "danger")}>
          <span>{activePoint.label}</span>
          <strong>{activePoint.margin >= 0 ? "+" : ""}{activePoint.margin} pts</strong>
        </div>
      </div>
      <div className="timeline-chart">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Courbes demande et production sur 24 heures">
          <defs>
            <linearGradient id="supplyGradient" x1="0" x2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.12 218)" />
              <stop offset="55%" stopColor="oklch(0.62 0.14 145)" />
              <stop offset="100%" stopColor="oklch(0.78 0.17 82)" />
            </linearGradient>
          </defs>
          {[0, 6, 12, 18, 23].map((hour) => (
            <g key={hour}>
              <line className="timeline-grid" x1={xFor(hour)} x2={xFor(hour)} y1="0" y2={chartHeight} />
              <text className="timeline-label" x={xFor(hour)} y={chartHeight - 2}>
                {String(hour).padStart(2, "0")}h
              </text>
            </g>
          ))}
          {marginBars.map((bar) => (
            <rect
              className={clsx("margin-bar", bar.danger && "danger")}
              key={bar.hour}
              x={bar.x}
              y={bar.y}
              width="10"
              height={bar.height}
              rx="4"
            />
          ))}
          <path className="timeline-line demand" d={pathFor("demand")} />
          <path className="timeline-line supply" d={pathFor("supply")} />
          <line className="active-hour-line" x1={xFor(activeHour)} x2={xFor(activeHour)} y1="0" y2={chartHeight - 18} />
          <circle className="active-dot demand" cx={xFor(activeHour)} cy={yFor(activePoint.demand)} r="6" />
          <circle className="active-dot supply" cx={xFor(activeHour)} cy={yFor(activePoint.supply)} r="6" />
        </svg>
      </div>
      <div className="timeline-legend">
        <span><i className="supply" /> Production disponible</span>
        <span><i className="demand" /> Demande</span>
        <span><i className="danger" /> Marge négative</span>
      </div>
    </div>
  );
}

function FranceScenarioMap({
  scenario,
  result,
  activePoint,
}: {
  scenario: ScenarioState;
  result: SimulationResult;
  activePoint: DaySimulationPoint;
}) {
  const gridTone = result.blackoutRisk > 65 ? "danger" : result.stability > 72 ? "stable" : "tense";
  const nodeScale = {
    solar: 12 + scenario.solar * 0.16,
    wind: 12 + scenario.wind * 0.14,
    nuclear: 12 + scenario.nuclear * 0.12,
    hydro: 12 + scenario.hydro * 0.34,
    storage: 12 + scenario.storage * 0.13,
    gas: 10 + scenario.gas * 0.26,
  };

  return (
    <div className={clsx("france-control-map", gridTone)}>
      <div className="map-status-strip">
        <span>{challenges[scenario.challenge].label}</span>
        <strong>{activePoint.eventLabel ?? "Réseau piloté"}</strong>
      </div>
      <svg viewBox="0 0 720 620" role="img" aria-label="Carte énergétique stylisée de la France">
        <defs>
          <filter id="controlGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="controlFlow" x1="0" x2="1">
            <stop offset="0%" stopColor={energyColors.wind} />
            <stop offset="48%" stopColor={energyColors.nuclear} />
            <stop offset="100%" stopColor={energyColors.solar} />
          </linearGradient>
        </defs>
        <path
          className="control-france"
          d="M319 56 451 82 523 155 604 219 574 333 627 419 512 495 397 525 300 488 197 503 122 406 160 300 117 214 202 127Z"
        />
        <path className="control-region" d="M319 56 332 225 202 127" />
        <path className="control-region" d="M332 225 523 155 604 219" />
        <path className="control-region" d="M332 225 397 525 197 503" />
        <path className="control-region" d="M332 225 574 333 512 495 397 525" />
        <path className="control-flow flow-a" d="M184 407 C252 331 290 250 359 221 C454 182 525 224 594 307" />
        <path className="control-flow flow-b" d="M203 137 C276 205 346 265 406 349 C454 415 507 452 585 424" />
        <path className="control-flow flow-c" d="M297 486 C322 383 317 284 382 202 C420 153 468 118 540 125" />
        <path className="control-flow flow-d" d="M150 285 C264 292 354 315 457 289 C520 273 552 236 604 212" />
        {[
          { key: "wind", x: 208, y: 132, color: energyColors.wind, label: "Éolien", r: nodeScale.wind },
          { key: "nuclear", x: 463, y: 91, color: energyColors.nuclear, label: "Nucléaire", r: nodeScale.nuclear },
          { key: "solar", x: 586, y: 311, color: energyColors.solar, label: "Solaire", r: nodeScale.solar },
          { key: "hydro", x: 302, y: 488, color: energyColors.hydro, label: "Hydraulique", r: nodeScale.hydro },
          { key: "storage", x: 421, y: 358, color: "oklch(0.53 0.15 182)", label: "Stockage", r: nodeScale.storage },
          { key: "gas", x: 532, y: 157, color: energyColors.gas, label: "Gaz", r: nodeScale.gas },
        ].map((node) => (
          <g className="control-node" key={node.key} transform={`translate(${node.x} ${node.y})`}>
            <circle r={node.r} fill={node.color} />
            <circle r="5" />
            <text y={node.r + 22}>{node.label}</text>
          </g>
        ))}
        {result.blackoutRisk > 58 ? (
          <g className="blackout-zone">
            <path d="M122 406 197 503 300 488 332 225 160 300Z" />
            <text x="198" y="404">Zone sous tension</text>
          </g>
        ) : null}
        <g className="control-city" transform="translate(300 395)">
          <rect x="0" y="22" width="22" height="50" rx="5" />
          <rect x="34" y="0" width="30" height="72" rx="6" />
          <rect x="77" y="16" width="22" height="56" rx="5" />
          <rect x="112" y="30" width="36" height="42" rx="6" />
        </g>
      </svg>
      <div className="map-readout">
        <span>Marge active</span>
        <strong>{activePoint.margin >= 0 ? "+" : ""}{activePoint.margin}</strong>
        <small>risque {activePoint.blackoutRisk}%</small>
      </div>
    </div>
  );
}

function ScenarioPassport({
  scenario,
  result,
  summary,
  onCopy,
  onDownload,
  downloading,
}: {
  scenario: ScenarioState;
  result: SimulationResult;
  summary: ReturnType<typeof summarizeDaySimulation>;
  onCopy: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  const mix = [
    { label: "Solaire", value: scenario.solar, color: energyColors.solar },
    { label: "Éolien", value: scenario.wind, color: energyColors.wind },
    { label: "Hydro", value: scenario.hydro, color: energyColors.hydro },
    { label: "Nucléaire", value: scenario.nuclear, color: energyColors.nuclear },
    { label: "Stockage", value: scenario.storage, color: "oklch(0.53 0.15 182)" },
    { label: "Gaz", value: scenario.gas, color: energyColors.gas },
  ];

  return (
    <div className="scenario-passport">
      <div>
        <p className="scenario-label">Carte du scénario</p>
        <h3>{result.verdict}</h3>
        <p>Un résumé prêt à partager : score, stress test 24h et grands choix de mix.</p>
      </div>
      <div className="passport-score">
        <strong>{result.score}</strong>
        <span>/100</span>
      </div>
      <div className="passport-bars">
        {mix.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <i>
              <b style={{ width: `${Math.min(100, item.value)}%`, background: item.color }} />
            </i>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="passport-footer">
        <span>{summary.blackoutHours} h critiques</span>
        <span>marge min. {summary.minMargin}</span>
        <div className="passport-actions">
          <button className="ghost-button compact" type="button" onClick={onDownload} disabled={downloading}>
            <Download size={16} />
            {downloading ? "Préparation..." : "Télécharger l’image"}
          </button>
          <button className="primary-button compact" type="button" onClick={onCopy}>
            <Copy size={16} />
            Copier
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlRoomOverview({
  snapshot,
  scenario,
}: {
  snapshot: LiveMixSnapshot | null;
  scenario: ScenarioState;
}) {
  const result = useMemo(() => simulateScenario(scenario), [scenario]);
  const dayPoints = useMemo(() => buildDaySimulation(scenario), [scenario]);
  const summary = useMemo(() => summarizeDaySimulation(dayPoints), [dayPoints]);
  const currentLowCarbon = snapshot
    ? (snapshot.nuclear ?? 0) + (snapshot.wind ?? 0) + (snapshot.solar ?? 0) + (snapshot.hydro ?? 0) + (snapshot.bioenergy ?? 0)
    : 0;
  const currentThermal = snapshot ? (snapshot.gas ?? 0) + (snapshot.oil ?? 0) + (snapshot.coal ?? 0) : 0;
  const currentTotal = Math.max(1, currentLowCarbon + currentThermal);
  const activeChallenge = challenges[scenario.challenge];

  return (
    <section id="cockpit" className="section-shell cockpit-shell">
      <div className="cockpit-header">
        <div>
          <p className="scenario-label">Centre de pilotage public</p>
          <h2>Un réseau, deux réalités : maintenant et ton 2050.</h2>
        </div>
        <span className={clsx("data-pill", snapshot?.isFallback && "fallback")}>
          {snapshot?.sourceLabel ?? "Connexion aux données..."}
        </span>
      </div>

      <div className="cockpit-grid">
        <div className="cockpit-main">
          <div className="radar-title">
            <Activity size={18} />
            <span>{activeChallenge.label}</span>
          </div>
          <strong>{result.verdict}</strong>
          <p>
            La marge minimale simulée atteint {summary.minMargin >= 0 ? "+" : ""}{summary.minMargin} points à {summary.worstHour.label}. Le scénario traverse {summary.blackoutHours} heure{summary.blackoutHours > 1 ? "s" : ""} critique{summary.blackoutHours > 1 ? "s" : ""}.
          </p>
        </div>
        <ControlStat label="Score 2050" value={`${result.score}/100`} detail="verdict dynamique" tone="var(--primary)" />
        <ControlStat label="CO₂ 2050" value={`${result.emissions} g/kWh`} detail="estimation simplifiée" tone={result.emissions > 80 ? energyColors.fossil : "oklch(0.62 0.14 145)"} />
        <ControlStat label="Bas-carbone actuel" value={`${Math.round((currentLowCarbon / currentTotal) * 100)}%`} detail="mix RTE instantané" tone={energyColors.nuclear} />
        <ControlStat label="Risque max 24h" value={`${summary.maxRisk}%`} detail="stress test simulé" tone={summary.maxRisk > 70 ? energyColors.fossil : energyColors.wind} />
      </div>

      <div className="compare-grid">
        <div className="compare-card">
          <h3>Maintenant</h3>
          <p>{snapshot ? formatDate(snapshot.timestamp) : "Donnée en chargement"}</p>
          <div className="compare-bars">
            {[
              { label: "Nucléaire", value: snapshot?.nuclear ?? 0, color: energyColors.nuclear },
              { label: "Éolien", value: snapshot?.wind ?? 0, color: energyColors.wind },
              { label: "Solaire", value: snapshot?.solar ?? 0, color: energyColors.solar },
              { label: "Hydraulique", value: snapshot?.hydro ?? 0, color: energyColors.hydro },
              { label: "Thermique", value: currentThermal, color: energyColors.gas },
            ].map((item) => (
              <span key={item.label}>
                <i>{item.label}</i>
                <b>
                  <em style={{ width: `${Math.min(100, (item.value / currentTotal) * 100)}%`, background: item.color }} />
                </b>
                <strong>{formatCompact(item.value)}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="compare-card future">
          <h3>Ton 2050</h3>
          <p>{activeChallenge.short} · modèle volontairement simplifié</p>
          <div className="compare-bars">
            {[
              { label: "Solaire", value: scenario.solar, color: energyColors.solar },
              { label: "Éolien", value: scenario.wind, color: energyColors.wind },
              { label: "Hydraulique", value: scenario.hydro, color: energyColors.hydro },
              { label: "Nucléaire", value: scenario.nuclear, color: energyColors.nuclear },
              { label: "Stockage", value: scenario.storage, color: "oklch(0.53 0.15 182)" },
              { label: "Gaz", value: scenario.gas, color: energyColors.gas },
            ].map((item) => (
              <span key={item.label}>
                <i>{item.label}</i>
                <b>
                  <em style={{ width: `${Math.min(100, item.value)}%`, background: item.color }} />
                </b>
                <strong>{item.value}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SimulatorSection({
  scenario,
  setScenario,
  onCopy,
}: {
  scenario: ScenarioState;
  setScenario: (scenario: ScenarioState) => void;
  onCopy: () => void;
}) {
  const result = useMemo(() => simulateScenario(scenario), [scenario]);
  const dayPoints = useMemo(() => buildDaySimulation(scenario), [scenario]);
  const daySummary = useMemo(() => summarizeDaySimulation(dayPoints), [dayPoints]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [activeHour, setActiveHour] = useState(19);
  const activePoint = dayPoints[activeHour] ?? dayPoints[0];

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setActiveHour((hour) => (hour + 1) % 24);
    }, 720);

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const update = (key: keyof Omit<ScenarioState, "challenge">, value: number) => {
    setScenario({ ...scenario, [key]: value });
  };
  const setChallenge = (challenge: ChallengeId) => setScenario({ ...scenario, challenge });
  const handleDownloadCard = async () => {
    setIsDownloadingCard(true);
    try {
      await downloadScenarioCardImage(scenario, result, daySummary);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  return (
    <section id="simulateur" className="section-shell simulator-shell">
      <div className="section-heading">
        <div>
          <h2>Salle de contrôle 2050</h2>
          <p>Vise au moins 80/100, zéro heure critique, et un CO₂ bas. Les curseurs changent immédiatement le verdict.</p>
        </div>
        <div className="simulator-actions">
          <button className="ghost-button" type="button" onClick={() => setIsPlaying((playing) => !playing)}>
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            {isPlaying ? "Pause 24h" : "Lancer 24h"}
          </button>
          <button className="primary-button compact" type="button" onClick={onCopy}>
            <Copy size={17} />
            Copier mon scénario
          </button>
        </div>
      </div>

      <div className="playbook-panel">
        <div>
          <span className="playbook-kicker">Ce que tu dois faire</span>
          <strong>Construis un mix qui produit assez, reste stable, et tient sous stress.</strong>
        </div>
        <ul>
          <li>
            <ShieldCheck size={16} />
            <span>Si la stabilité chute, ajoute du stockage, de la sobriété ou une base pilotable.</span>
          </li>
          <li>
            <CloudSun size={16} />
            <span>Teste une crise : elle révèle les faiblesses que le score moyen cache.</span>
          </li>
          <li>
            <Share2 size={16} />
            <span>Quand ton scénario tient, copie le lien ou télécharge la carte résultat.</span>
          </li>
        </ul>
      </div>

      <div className="mission-strip">
        <ControlStat
          label="Statut réseau"
          value={daySummary.status === "secure" ? "Stable" : daySummary.status === "tense" ? "Sous tension" : "Critique"}
          detail={`${daySummary.blackoutHours} h critiques sur 24`}
          tone={daySummary.status === "secure" ? "oklch(0.62 0.14 145)" : daySummary.status === "tense" ? energyColors.gas : energyColors.fossil}
        />
        <ControlStat label="Marge minimale" value={`${daySummary.minMargin >= 0 ? "+" : ""}${daySummary.minMargin}`} detail={`${daySummary.worstHour.label}, pire heure`} tone={daySummary.minMargin < 0 ? energyColors.fossil : "var(--primary)"} />
        <ControlStat label="Stockage final" value={`${daySummary.finalStorage}%`} detail="réserve simulée après 24h" tone="oklch(0.53 0.15 182)" />
        <ControlStat label="Risque max" value={`${daySummary.maxRisk}%`} detail="risque de blackout simulé" tone={daySummary.maxRisk > 70 ? energyColors.fossil : energyColors.wind} />
      </div>

      <div className="challenge-bar cinematic" aria-label="Challenges rapides">
        {(Object.keys(challenges) as ChallengeId[])
          .filter((id) => id !== "normal")
          .map((id) => {
            const Icon = challengeIcons[id];
            return (
              <button
                className={clsx("challenge-button", `severity-${challenges[id].severity}`, scenario.challenge === id && "active")}
                key={id}
                type="button"
                onClick={() => {
                  setChallenge(scenario.challenge === id ? "normal" : id);
                  setActiveHour(id === "solarDay" ? 13 : 19);
                }}
              >
                <Icon size={19} />
                <span>{challenges[id].short}</span>
                <small>{challenges[id].description}</small>
              </button>
            );
          })}
      </div>

      <div className="control-room-grid">
        <FranceScenarioMap scenario={scenario} result={result} activePoint={activePoint} />

        <div className="verdict-panel command-verdict">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="scenario-label">{challenges[scenario.challenge].label}</p>
              <h3>{result.verdict}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{result.explanation}</p>
            </div>
            <ScoreRing score={result.score} />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Meter label="Stabilité" value={result.stability} tone="var(--primary)" />
            <Meter label="Part renouvelable" value={result.renewableShare} tone="oklch(0.62 0.14 145)" />
            <Meter label="Équilibre offre-demande" value={result.supplyBalance} tone="oklch(0.55 0.16 240)" />
            <Meter label="Risque de blackout" value={result.blackoutRisk} tone="oklch(0.55 0.18 28)" />
          </div>

          <div className="result-stats">
            <div>
              <span>CO₂ estimé</span>
              <strong>{result.emissions} g/kWh</strong>
            </div>
            <div>
              <span>Coût relatif</span>
              <strong>{result.cost}/100</strong>
            </div>
            <div>
              <span>Pression demande</span>
              <strong>{result.demandPressure}/100</strong>
            </div>
          </div>

          <div className="hour-scrubber">
            <label htmlFor="active-hour">Heure simulée</label>
            <input
              id="active-hour"
              className="range"
              type="range"
              min="0"
              max="23"
              value={activeHour}
              aria-label="Heure simulée"
              style={{ "--range-color": activePoint.margin < 0 ? energyColors.fossil : "var(--primary)" } as CSSProperties}
              onChange={(event) => setActiveHour(Number(event.currentTarget.value))}
              onInput={(event) => setActiveHour(Number(event.currentTarget.value))}
            />
            <strong>{activePoint.label}</strong>
          </div>
        </div>
      </div>

      <div className="simulation-deck">
        <DayTimeline points={dayPoints} activeHour={activeHour} />
        <ScenarioPassport
          scenario={scenario}
          result={result}
          summary={daySummary}
          onCopy={onCopy}
          onDownload={handleDownloadCard}
          downloading={isDownloadingCard}
        />
      </div>

      <div className="simulator-grid upgraded">
        <div className="controls-panel">
          <SliderControl label="Solaire" icon={SunMedium} value={scenario.solar} helper="Fort le jour, variable le soir" accent={energyColors.solar} onChange={(value) => update("solar", value)} />
          <SliderControl label="Éolien" icon={Wind} value={scenario.wind} helper="Puissant mais météo-dépendant" accent={energyColors.wind} onChange={(value) => update("wind", value)} />
          <SliderControl label="Hydraulique" icon={Waves} value={scenario.hydro} max={30} helper="Très stable, potentiel plafonné" accent={energyColors.hydro} onChange={(value) => update("hydro", value)} />
          <SliderControl label="Nucléaire" icon={Factory} value={scenario.nuclear} helper="Pilotable et bas-carbone" accent={energyColors.nuclear} onChange={(value) => update("nuclear", value)} />
          <SliderControl label="Stockage" icon={BatteryCharging} value={scenario.storage} helper="Absorbe les creux et surplus" accent="oklch(0.53 0.15 182)" onChange={(value) => update("storage", value)} />
          <SliderControl label="Sobriété énergétique" icon={Lightbulb} value={scenario.sobriety} max={45} helper="Réduit la pression sur la demande" accent="oklch(0.62 0.14 145)" onChange={(value) => update("sobriety", value)} />
          <SliderControl label="Gaz de secours" icon={Flame} value={scenario.gas} max={35} helper="Sécurise, mais émet du CO₂" accent={energyColors.gas} onChange={(value) => update("gas", value)} />
        </div>

        <div className="verdict-panel explanation-panel">
          <div className="advice-box">
            <h4>Conseils automatiques</h4>
            <ul>
              {result.advice.map((item) => (
                <li key={item}>
                  <ChevronDown size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WattopiaApp({ initialSnapshot }: { initialSnapshot: LiveMixSnapshot }) {
  const [snapshot, setSnapshot] = useState<LiveMixSnapshot | null>(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<ScenarioState>(defaultScenario);

  useEffect(() => {
    const restoreScenario = window.setTimeout(() => {
      setScenario(scenarioFromParams(new URLSearchParams(window.location.search)));
    }, 0);

    return () => window.clearTimeout(restoreScenario);
  }, []);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const demo = new URLSearchParams(window.location.search).get("demo") === "1";
      setSnapshot(await fetchLiveMixSnapshot(demo));
    } catch {
      setSnapshot(await fetchLiveMixSnapshot(true));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refreshSnapshot = window.setTimeout(() => {
      void loadSnapshot();
    }, 0);

    return () => window.clearTimeout(refreshSnapshot);
  }, []);

  const copyScenario = () => {
    const params = scenarioToParams(scenario);
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (demo === "1") params.set("demo", "1");
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const toast = document.getElementById("copy-toast");
    toast?.classList.add("visible");
    window.setTimeout(() => toast?.classList.remove("visible"), 4000);
    window.setTimeout(() => window.history.replaceState(null, "", url), 140);

    const fallbackCopy = () => {
      const helper = document.createElement("textarea");
      helper.value = url;
      helper.setAttribute("readonly", "true");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      document.body.removeChild(helper);
    };

    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--ink)]">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Wattopia 2050">
          <span className="brand-mark">
            <Zap size={19} fill="currentColor" />
          </span>
          <span>
            <strong>Wattopia 2050</strong>
            <small>Simulateur France</small>
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          <a href="#mission">Mission</a>
          <a href="#cockpit">Cockpit</a>
          <a href="#maintenant">Maintenant</a>
          <a href="#simulateur">Simulateur</a>
          <a href="#methode">Méthode</a>
          <a href="#sources">Sources</a>
        </nav>
        <button className="primary-button compact" type="button" onClick={() => document.getElementById("simulateur")?.scrollIntoView({ behavior: "smooth" })}>
          <Share2 size={16} />
          Simuler
        </button>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <motion.h1 initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Wattopia 2050
          </motion.h1>
          <motion.p className="hero-subtitle" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }}>
            Construis le mix énergétique de la France et évite le blackout.
          </motion.p>
          <p className="hero-proof">
            Ta mission : régler les sources d’énergie, lancer des crises météo, puis atteindre le meilleur score possible sans heures critiques. Basé sur des données réelles du réseau électrique français.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => document.getElementById("simulateur")?.scrollIntoView({ behavior: "smooth" })}>
              <Zap size={18} />
              Lancer la simulation
            </button>
            <a className="secondary-button" href="#maintenant">
              Voir le mix actuel
            </a>
          </div>
          <div className="hero-facts" aria-label="Points clés">
            <span>
              <ShieldCheck size={16} />
              But : 80/100+
            </span>
            <span>
              <Cable size={16} />
              Zéro heure critique
            </span>
            <span>
              <CloudSun size={16} />
              Crises météo
            </span>
          </div>
        </div>
        <EnergyMap />
      </section>

      <MissionBrief />
      <ControlRoomOverview snapshot={snapshot} scenario={scenario} />
      <LiveMixSection snapshot={snapshot} loading={loading} onRefresh={loadSnapshot} />
      <SimulatorSection scenario={scenario} setScenario={setScenario} onCopy={copyScenario} />

      <section id="methode" className="section-shell method-shell">
        <div>
          <h2>Comment le score est calculé ?</h2>
          <p>Le score combine stabilité du réseau, CO₂ estimé, coût relatif, équilibre offre-demande et part renouvelable.</p>
          <p>Trop de solaire ou d’éolien sans stockage réduit la stabilité ; sobriété, hydraulique, nucléaire et stockage l’améliorent.</p>
          <p>Le gaz sécurise certains pics mais dégrade le score carbone.</p>
          <p>Cette simulation est volontairement simplifiée pour un hackathon. Elle sert à comprendre les compromis du mix électrique, pas à prédire officiellement le réseau français.</p>
        </div>
      </section>

      <footer id="sources" className="site-footer">
        <div>
          <h2>Sources</h2>
          <p>Données et inspiration publiques utilisées pour ancrer l’expérience.</p>
        </div>
        <div className="source-links">
          <a href="https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/api/" target="_blank" rel="noreferrer">
            RTE éCO2mix
          </a>
          <a href="https://odre.opendatasoft.com/" target="_blank" rel="noreferrer">
            ODRÉ / OpenDataSoft
          </a>
          <a href="https://www.rte-france.com/donnees-publications/etudes-prospectives/futurs-energetique-2050" target="_blank" rel="noreferrer">
            RTE Futurs énergétiques 2050
          </a>
          <a href="https://rte-futursenergetiques2050.com/panorama/scenarios" target="_blank" rel="noreferrer">
            Panorama des scénarios
          </a>
        </div>
      </footer>
      <div id="copy-toast" className="copy-toast" aria-live="polite">
        Lien de scénario copié
      </div>
    </main>
  );
}
