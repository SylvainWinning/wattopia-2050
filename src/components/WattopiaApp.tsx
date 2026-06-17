"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  BatteryCharging,
  Cable,
  ChevronDown,
  CloudSun,
  Copy,
  Factory,
  Flame,
  Gauge,
  Leaf,
  Lightbulb,
  Loader2,
  RadioTower,
  RefreshCw,
  Share2,
  ShieldCheck,
  SunMedium,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import type { LiveMixSnapshot } from "@/lib/live-mix";
import {
  type ChallengeId,
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
  const update = (key: keyof Omit<ScenarioState, "challenge">, value: number) => {
    setScenario({ ...scenario, [key]: value });
  };
  const setChallenge = (challenge: ChallengeId) => setScenario({ ...scenario, challenge });

  return (
    <section id="simulateur" className="section-shell simulator-shell">
      <div className="section-heading">
        <div>
          <h2>Construis ton mix 2050</h2>
          <p>Déplace les curseurs, lance un stress test météo, puis partage ton scénario par URL.</p>
        </div>
        <button className="primary-button compact" type="button" onClick={onCopy}>
          <Copy size={17} />
          Copier mon scénario
        </button>
      </div>

      <div className="challenge-bar" aria-label="Challenges rapides">
        {(Object.keys(challenges) as ChallengeId[])
          .filter((id) => id !== "normal")
          .map((id) => (
            <button
              className={clsx("challenge-button", scenario.challenge === id && "active")}
              key={id}
              type="button"
              onClick={() => setChallenge(scenario.challenge === id ? "normal" : id)}
            >
              <span>{challenges[id].short}</span>
              <small>{challenges[id].description}</small>
            </button>
          ))}
      </div>

      <div className="simulator-grid">
        <div className="controls-panel">
          <SliderControl label="Solaire" icon={SunMedium} value={scenario.solar} helper="Fort le jour, variable le soir" accent={energyColors.solar} onChange={(value) => update("solar", value)} />
          <SliderControl label="Éolien" icon={Wind} value={scenario.wind} helper="Puissant mais météo-dépendant" accent={energyColors.wind} onChange={(value) => update("wind", value)} />
          <SliderControl label="Hydraulique" icon={Waves} value={scenario.hydro} max={30} helper="Très stable, potentiel plafonné" accent={energyColors.hydro} onChange={(value) => update("hydro", value)} />
          <SliderControl label="Nucléaire" icon={Factory} value={scenario.nuclear} helper="Pilotable et bas-carbone" accent={energyColors.nuclear} onChange={(value) => update("nuclear", value)} />
          <SliderControl label="Stockage" icon={BatteryCharging} value={scenario.storage} helper="Absorbe les creux et surplus" accent="oklch(0.53 0.15 182)" onChange={(value) => update("storage", value)} />
          <SliderControl label="Sobriété énergétique" icon={Lightbulb} value={scenario.sobriety} max={45} helper="Réduit la pression sur la demande" accent="oklch(0.62 0.14 145)" onChange={(value) => update("sobriety", value)} />
          <SliderControl label="Gaz de secours" icon={Flame} value={scenario.gas} max={35} helper="Sécurise, mais émet du CO₂" accent={energyColors.gas} onChange={(value) => update("gas", value)} />
        </div>

        <div className="verdict-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
      const response = await fetch(`/api/live-mix${demo ? "?demo=1" : ""}`);
      const nextSnapshot = (await response.json()) as LiveMixSnapshot;
      setSnapshot(nextSnapshot);
    } catch {
      const response = await fetch("/api/live-mix?demo=1");
      const nextSnapshot = (await response.json()) as LiveMixSnapshot;
      setSnapshot(nextSnapshot);
    } finally {
      setLoading(false);
    }
  };

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
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Wattopia 2050
          </motion.h1>
          <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }}>
            Construis le mix énergétique de la France et évite le blackout.
          </motion.p>
          <p className="hero-proof">Basé sur des données réelles du réseau électrique français.</p>
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
              Score instantané
            </span>
            <span>
              <Cable size={16} />
              Scénarios partageables
            </span>
            <span>
              <CloudSun size={16} />
              Stress tests météo
            </span>
          </div>
        </div>
        <EnergyMap />
      </section>

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
