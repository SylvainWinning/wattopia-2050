"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Cable,
  CheckCircle2,
  Copy,
  Factory,
  Flame,
  Gauge,
  Leaf,
  Lightbulb,
  Loader2,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { fetchLiveMixSnapshot } from "@/lib/fetch-live-mix";
import type { LiveMixSnapshot } from "@/lib/live-mix";
import {
  MAX_DECISIONS,
  actionById,
  buildMissionFromSnapshot,
  buildShareText,
  getCityState,
  gridCities,
  missionActions,
  missionModes,
  simulateMission,
  type ActionId,
  type MetricEffect,
  type MissionAction,
  type MissionMetrics,
  type MissionModeId,
  type MissionState,
} from "@/lib/blackout-game";

type Phase = "intro" | "mission" | "result";

const metricLabels: Record<keyof MissionMetrics, string> = {
  stability: "Stabilité réseau",
  co2Score: "CO2",
  budget: "Budget",
  citizenTrust: "Confiance citoyenne",
  blackoutRisk: "Risque blackout",
  lightsOn: "Zones allumées",
};

const actionIcons: Record<MissionAction["icon"], LucideIcon> = {
  battery: BatteryCharging,
  flame: Flame,
  home: Lightbulb,
  import: Cable,
  shield: ShieldCheck,
  factory: Factory,
  megaphone: RadioTower,
  waves: Waves,
};

const modeIds: readonly MissionModeId[] = ["france", "paris", "future2050"];

const linePairs = [
  ["lille", "paris"],
  ["paris", "nantes"],
  ["paris", "strasbourg"],
  ["paris", "lyon"],
  ["nantes", "bordeaux"],
  ["bordeaux", "toulouse"],
  ["lyon", "marseille"],
  ["lyon", "strasbourg"],
  ["toulouse", "marseille"],
] as const;

const formatNumber = (value: number | null): string =>
  value === null ? "n.d." : new Intl.NumberFormat("fr-FR").format(Math.round(value));

const resultParam: Record<MissionState["result"]["kind"], string> = {
  stable: "stable",
  partial: "partial",
  blackout: "blackout",
};

function parseMode(raw: string | null): MissionModeId {
  return raw === "paris" || raw === "future2050" || raw === "france" ? raw : "france";
}

function parseActions(raw: string | null): ActionId[] {
  if (!raw) return [];

  return raw
    .split(",")
    .filter((value): value is ActionId => {
      try {
        actionById(value as ActionId);
        return true;
      } catch {
        return false;
      }
    })
    .slice(0, MAX_DECISIONS);
}

function getInitialMode(): MissionModeId {
  if (typeof window === "undefined") return "france";
  return parseMode(new URLSearchParams(window.location.search).get("mode"));
}

function getInitialActions(): ActionId[] {
  if (typeof window === "undefined") return [];
  return parseActions(new URLSearchParams(window.location.search).get("actions"));
}

function getInitialPhase(): Phase {
  if (typeof window === "undefined") return "intro";
  const params = new URLSearchParams(window.location.search);
  const actions = parseActions(params.get("actions"));
  return actions.length >= MAX_DECISIONS || params.get("result") ? "result" : "intro";
}

function sourceStatus(snapshot: LiveMixSnapshot | null, loading: boolean) {
  if (loading) return "Synchronisation ODRÉ...";
  if (!snapshot) return "Chargement du réseau...";
  return snapshot.sourceLabel;
}

function effectEntries(effect: MetricEffect) {
  return (Object.entries(effect) as Array<[keyof MissionMetrics, number]>)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => ({
      key,
      label: metricLabels[key],
      value,
    }));
}

function classifyRisk(metrics: MissionMetrics) {
  if (metrics.blackoutRisk >= 72 || metrics.stability < 42) return "danger";
  if (metrics.blackoutRisk >= 44 || metrics.stability < 65) return "tense";
  return "secure";
}

function MetricMeter({
  label,
  value,
  inverse = false,
}: {
  label: string;
  value: number;
  inverse?: boolean;
}) {
  const danger = inverse ? value > 66 : value < 42;
  const tense = inverse ? value > 40 : value < 68;

  return (
    <div className="metric-meter">
      <div className="metric-meter-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="metric-track" aria-hidden="true">
        <motion.span
          className={clsx("metric-fill", danger ? "danger" : tense ? "tense" : "secure")}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function FranceGridMap({
  state,
  compact = false,
}: {
  state: MissionState;
  compact?: boolean;
}) {
  const tone = classifyRisk(state.metrics);
  const cityById = new Map(gridCities.map((city) => [city.id, city]));

  return (
    <div className={clsx("france-grid-map", `map-${tone}`, compact && "compact")}>
      <svg viewBox="0 0 100 100" role="img" aria-label="Carte stylisée du réseau électrique français">
        <defs>
          <filter id="networkGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="france-shape"
          d="M49 6 L65 12 L82 29 L78 48 L86 65 L72 84 L54 91 L38 84 L22 88 L13 72 L18 54 L10 38 L20 20 L36 13 Z"
        />
        <path className="corsica-mark" d="M77 80 C82 83 82 90 78 94 C74 90 74 84 77 80 Z" />
        {linePairs.map(([fromId, toId]) => {
          const from = cityById.get(fromId);
          const to = cityById.get(toId);
          if (!from || !to) return null;

          return (
            <motion.line
              key={`${fromId}-${toId}`}
              className="grid-line"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              initial={false}
              animate={{ pathLength: tone === "danger" ? 0.68 : 1, opacity: tone === "danger" ? 0.5 : 0.95 }}
              transition={{ duration: 0.28 }}
            />
          );
        })}
        {gridCities.map((city) => {
          const cityState = getCityState(state.metrics, city);
          const radius = city.id === "paris" ? 3.7 : 2.8;

          return (
            <g key={city.id} className={clsx("city-node", `city-${cityState}`)}>
              <motion.circle
                cx={city.x}
                cy={city.y}
                r={radius + 2}
                initial={false}
                animate={{
                  opacity: cityState === "off" ? 0.1 : cityState === "fragile" ? [0.35, 0.8, 0.35] : 0.58,
                  scale: cityState === "fragile" ? [0.92, 1.12, 0.92] : 1,
                }}
                transition={{ duration: 1.2, repeat: cityState === "fragile" ? Infinity : 0 }}
              />
              <circle cx={city.x} cy={city.y} r={radius} />
              {!compact && (
                <text x={city.x + 4} y={city.y - 2}>
                  {city.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="map-readout">
        <span>{state.metrics.lightsOn}% des zones restent allumées</span>
        <strong>{state.metrics.blackoutRisk}% risque blackout</strong>
      </div>
    </div>
  );
}

function Hero({
  state,
  snapshot,
  loading,
  onStart,
  onRefresh,
}: {
  state: MissionState;
  snapshot: LiveMixSnapshot | null;
  loading: boolean;
  onStart: () => void;
  onRefresh: () => void;
}) {
  const badge = sourceStatus(snapshot, loading);

  return (
    <section id="top" className="blackout-hero">
      <div className="hero-copy">
        <div className="signal-row">
          <span className={clsx("source-badge", snapshot?.isFallback && "fallback")}>
            <Activity size={16} />
            {badge}
          </span>
          <button type="button" className="icon-button" onClick={onRefresh} disabled={loading} aria-label="Rafraîchir les données">
            {loading ? <Loader2 size={17} className="spin" /> : <RefreshCw size={17} />}
          </button>
        </div>
        <h1>BLACKOUT</h1>
        <p className="hero-subtitle">Empêche la France de s&apos;éteindre.</p>
        <p className="hero-text">
          La demande explose. Le réseau vacille. Tu as 5 décisions pour garder la France allumée sans faire exploser le CO2, le budget ou la confiance citoyenne.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary-action" onClick={onStart}>
            <Zap size={18} />
            Prendre le contrôle
          </button>
          <a className="secondary-action" href="#mission">
            Voir la mission
          </a>
        </div>
        <p className="data-note">{buildMissionFromSnapshot(snapshot)}</p>
      </div>
      <div className="hero-stage">
        <FranceGridMap state={state} />
        <div className="risk-console">
          <span>Jauge blackout</span>
          <strong>{state.metrics.blackoutRisk}%</strong>
          <div className="risk-rail">
            <motion.span initial={false} animate={{ width: `${state.metrics.blackoutRisk}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionSelector({
  modeId,
  onSelect,
}: {
  modeId: MissionModeId;
  onSelect: (modeId: MissionModeId) => void;
}) {
  return (
    <section className="mode-strip" aria-label="Choix de mission">
      {modeIds.map((id) => {
        const mode = missionModes[id];
        const active = id === modeId;

        return (
          <button
            type="button"
            key={id}
            className={clsx("mode-choice", active && "active")}
            onClick={() => onSelect(id)}
          >
            <span>{mode.title}</span>
            <strong>{mode.objective}</strong>
          </button>
        );
      })}
    </section>
  );
}

function ActionCard({
  action,
  selected,
  disabled,
  onChoose,
}: {
  action: MissionAction;
  selected: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const Icon = actionIcons[action.icon];

  return (
    <motion.button
      type="button"
      className={clsx("action-card", selected && "selected")}
      onClick={onChoose}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.985 }}
    >
      <span className="action-icon">
        <Icon size={20} />
      </span>
      <span className="action-body">
        <strong>{action.title}</strong>
        <span>{action.description}</span>
        <em>{action.tradeoff}</em>
      </span>
      <span className="effect-list" aria-label="Effets">
        {effectEntries(action.effect).slice(0, 4).map(({ key, label, value }) => (
          <span key={key} className={value >= 0 ? "positive" : "negative"} title={label}>
            {value > 0 ? "+" : ""}
            {value}
          </span>
        ))}
      </span>
    </motion.button>
  );
}

function MissionMeters({ metrics }: { metrics: MissionMetrics }) {
  return (
    <div className="meters-panel">
      <MetricMeter label="Stabilité réseau" value={metrics.stability} />
      <MetricMeter label="Risque blackout" value={metrics.blackoutRisk} inverse />
      <MetricMeter label="CO2" value={metrics.co2Score} />
      <MetricMeter label="Budget" value={metrics.budget} />
      <MetricMeter label="Confiance citoyenne" value={metrics.citizenTrust} />
    </div>
  );
}

function NarrativeLog({ state }: { state: MissionState }) {
  const latest = state.steps[state.steps.length - 1];

  return (
    <div className="narrative-panel">
      <div>
        <span>Journal opérationnel</span>
        <strong>{latest ? latest.event.title : "Alerte nationale ouverte"}</strong>
      </div>
      <p>
        {latest
          ? latest.narration
          : "Le centre de contrôle attend ta première décision. Chaque choix modifiera la carte, les jauges et la confiance citoyenne."}
      </p>
      <ol>
        {Array.from({ length: MAX_DECISIONS }, (_, index) => {
          const step = state.steps[index];

          return (
            <li key={index} className={step ? "done" : "pending"}>
              {step ? step.action.shortTitle : `Décision ${index + 1}`}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MissionExperience({
  state,
  phase,
  onChoose,
  onFinish,
}: {
  state: MissionState;
  phase: Phase;
  onChoose: (actionId: ActionId) => void;
  onFinish: () => void;
}) {
  const isComplete = state.selectedActions.length >= MAX_DECISIONS;

  return (
    <section id="mission" className="mission-shell">
      <div className="section-heading">
        <span>Mission active</span>
        <h2>{state.mode.title}</h2>
        <p>{state.mode.pitch}</p>
      </div>
      <div className="mission-layout">
        <div className="mission-visual">
          <FranceGridMap state={state} />
          <NarrativeLog state={state} />
        </div>
        <div className="mission-controls">
          <div className="decision-header">
            <div>
              <span>Décisions restantes</span>
              <strong>{state.decisionsRemaining}</strong>
            </div>
            <p>{state.mode.objective}</p>
          </div>
          <MissionMeters metrics={state.metrics} />
          <div className="actions-grid">
            {missionActions.map((action) => {
              const selected = state.selectedActions.some((selectedAction) => selectedAction.id === action.id);
              const disabled = selected || isComplete;

              return (
                <ActionCard
                  key={action.id}
                  action={action}
                  selected={selected}
                  disabled={disabled}
                  onChoose={() => onChoose(action.id)}
                />
              );
            })}
          </div>
          {isComplete && phase !== "result" && (
            <button type="button" className="primary-action wide" onClick={onFinish}>
              Révéler le verdict
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function FinalVerdict({
  state,
  onCopy,
  onReplay,
}: {
  state: MissionState;
  onCopy: () => void;
  onReplay: () => void;
}) {
  return (
    <section id="resultat" className={clsx("result-section", `result-${state.result.kind}`)}>
      <div className="result-visual">
        <FranceGridMap state={state} compact />
      </div>
      <div className="result-copy">
        <span>Verdict final</span>
        <h2>{state.result.title}</h2>
        <p>{state.result.text}</p>
        <div className="score-lockup">
          <strong>{state.result.score}</strong>
          <span>/100</span>
        </div>
        <div className="result-insights">
          <p>
            <CheckCircle2 size={16} />
            {state.result.bestPoint}
          </p>
          <p>
            <AlertTriangle size={16} />
            {state.result.biggestTradeoff}
          </p>
        </div>
        <ul className="tips-list">
          {state.result.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <div className="result-actions">
          <button type="button" className="primary-action" onClick={onCopy}>
            <Copy size={17} />
            Copier mon résultat
          </button>
          <button type="button" className="secondary-action button-reset" onClick={onReplay}>
            Rejouer
          </button>
        </div>
      </div>
    </section>
  );
}

function LiveDataPanel({
  snapshot,
  loading,
  onRefresh,
}: {
  snapshot: LiveMixSnapshot | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="live-data-panel" id="donnees">
      <div>
        <span className={clsx("source-badge", snapshot?.isFallback && "fallback")}>
          <Activity size={16} />
          {sourceStatus(snapshot, loading)}
        </span>
        <h2>Données réseau utilisées</h2>
        <p>
          BLACKOUT récupère un instantané public éCO2mix quand il est exploitable. Si l&apos;API ne répond pas, l&apos;expérience reste jouable avec un exemple réaliste.
        </p>
      </div>
      <div className="data-grid">
        <div>
          <span>Consommation</span>
          <strong>{formatNumber(snapshot?.consumption ?? null)} MW</strong>
        </div>
        <div>
          <span>Nucléaire</span>
          <strong>{formatNumber(snapshot?.nuclear ?? null)} MW</strong>
        </div>
        <div>
          <span>Éolien + solaire</span>
          <strong>{formatNumber((snapshot?.wind ?? 0) + (snapshot?.solar ?? 0))} MW</strong>
        </div>
        <div>
          <span>CO2</span>
          <strong>{snapshot?.co2Rate === null || snapshot?.co2Rate === undefined ? "n.d." : `${snapshot.co2Rate} g/kWh`}</strong>
        </div>
      </div>
      <button type="button" className="secondary-action button-reset" onClick={onRefresh} disabled={loading}>
        {loading ? <Loader2 size={17} className="spin" /> : <RefreshCw size={17} />}
        Rafraîchir
      </button>
    </section>
  );
}

function EducationSection() {
  const cards = [
    {
      icon: Gauge,
      title: "Équilibre permanent",
      text: "L'électricité doit être produite et consommée au même instant.",
    },
    {
      icon: Leaf,
      title: "Bas-carbone et flexibilité",
      text: "Les renouvelables réduisent le CO2, mais demandent stockage et pilotage.",
    },
    {
      icon: BatteryCharging,
      title: "Stockage et sobriété",
      text: "Les moments critiques se passent avec des réserves et de la demande déplacée.",
    },
    {
      icon: ShieldCheck,
      title: "Chaque choix coûte",
      text: "Stabilité, CO2, budget et acceptabilité ne montent pas toujours ensemble.",
    },
  ];

  return (
    <section className="education-section" id="pedagogie">
      <div className="section-heading">
        <span>Ce que BLACKOUT montre</span>
        <h2>Un réseau électrique est un compromis vivant.</h2>
        <p>
          Cette simulation est volontairement simplifiée pour un hackathon. Elle sert à rendre les compromis énergétiques compréhensibles, pas à prédire officiellement le réseau français.
        </p>
      </div>
      <div className="education-grid">
        {cards.map(({ icon: Icon, title, text }) => (
          <article key={title} className="education-card">
            <Icon size={22} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourcesFooter() {
  return (
    <footer className="sources-footer" id="sources">
      <div>
        <strong>BLACKOUT</strong>
        <span>Modèle simplifié pour hackathon. Non officiel RTE.</span>
      </div>
      <nav aria-label="Sources">
        <a href="https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/" target="_blank" rel="noreferrer">
          ODRÉ eco2mix-national-tr
        </a>
        <a href="https://www.rte-france.com/donnees-publications/eco2mix-donnees-temps-reel" target="_blank" rel="noreferrer">
          RTE éCO2mix
        </a>
        <a href="https://www.rte-france.com/donnees-publications/etudes-prospectives/futurs-energetique-2050" target="_blank" rel="noreferrer">
          RTE Futurs énergétiques 2050
        </a>
      </nav>
    </footer>
  );
}

export default function BlackoutApp({ initialSnapshot }: { initialSnapshot: LiveMixSnapshot }) {
  const [snapshot, setSnapshot] = useState<LiveMixSnapshot | null>(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [modeId, setModeId] = useState<MissionModeId>(getInitialMode);
  const [selectedActions, setSelectedActions] = useState<ActionId[]>(getInitialActions);
  const [phase, setPhase] = useState<Phase>(getInitialPhase);
  const [toast, setToast] = useState("Résultat copié");
  const [shareFallbackText, setShareFallbackText] = useState("");

  const missionState = useMemo(() => simulateMission(modeId, selectedActions), [modeId, selectedActions]);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const demo = new URLSearchParams(window.location.search).get("demo") === "1";
      setSnapshot(await fetchLiveMixSnapshot(demo));
    } catch {
      setSnapshot(await fetchLiveMixSnapshot(true));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void loadSnapshot();
    }, 0);

    return () => window.clearTimeout(refreshTimer);
  }, [loadSnapshot]);

  const startMission = () => {
    setPhase("mission");
    document.getElementById("mission")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectMode = (nextModeId: MissionModeId) => {
    setModeId(nextModeId);
    setSelectedActions([]);
    setPhase("mission");
  };

  const chooseAction = (actionId: ActionId) => {
    if (selectedActions.includes(actionId) || selectedActions.length >= MAX_DECISIONS) return;
    const nextActions = [...selectedActions, actionId];
    setSelectedActions(nextActions);
    setPhase("mission");
    if (nextActions.length >= MAX_DECISIONS) {
      window.setTimeout(() => {
        setPhase("result");
        document.getElementById("resultat")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 280);
    }
  };

  const replay = () => {
    setSelectedActions([]);
    setPhase("mission");
    document.getElementById("mission")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showToast = (message: string) => {
    setToast(message);
    const toastNode = document.getElementById("copy-toast");
    toastNode?.classList.add("visible");
    window.setTimeout(() => toastNode?.classList.remove("visible"), 3400);
  };

  const copyResult = async () => {
    const params = new URLSearchParams();
    params.set("mode", modeId);
    params.set("score", String(missionState.result.score));
    params.set("result", resultParam[missionState.result.kind]);
    params.set("actions", selectedActions.join(","));
    if (new URLSearchParams(window.location.search).get("demo") === "1") params.set("demo", "1");
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
    const text = `${buildShareText(missionState)}\n${url}`;

    try {
      await navigator.clipboard.writeText(text);
      setShareFallbackText("");
      showToast("Résultat BLACKOUT copié");
    } catch {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "true");
      helper.style.position = "fixed";
      helper.style.top = "0";
      helper.style.left = "0";
      helper.style.width = "1px";
      helper.style.height = "1px";
      helper.style.opacity = "0.01";
      helper.style.zIndex = "-1";
      document.body.appendChild(helper);
      helper.focus();
      helper.select();
      helper.setSelectionRange(0, helper.value.length);
      const copied = document.execCommand("copy");
      document.body.removeChild(helper);
      if (copied) {
        setShareFallbackText("");
        showToast("Résultat BLACKOUT copié");
      } else {
        setShareFallbackText(text);
        showToast("Résultat prêt à copier");
      }
    }
  };

  return (
    <main className="blackout-app">
      <header className="app-header">
        <a href="#top" className="brand-lockup" aria-label="BLACKOUT">
          <span>
            <Zap size={18} fill="currentColor" />
          </span>
          <strong>BLACKOUT</strong>
        </a>
        <nav aria-label="Navigation principale">
          <a href="#mission">Mission</a>
          <a href="#donnees">Données</a>
          <a href="#pedagogie">Pédagogie</a>
          <a href="#sources">Sources</a>
        </nav>
        <button type="button" className="header-cta" onClick={startMission}>
          Prendre le contrôle
        </button>
      </header>

      <Hero
        state={missionState}
        snapshot={snapshot}
        loading={loading}
        onRefresh={loadSnapshot}
        onStart={startMission}
      />

      <MissionSelector modeId={modeId} onSelect={selectMode} />

      <MissionExperience
        state={missionState}
        phase={phase}
        onChoose={chooseAction}
        onFinish={() => setPhase("result")}
      />

      {phase === "result" && <FinalVerdict state={missionState} onCopy={copyResult} onReplay={replay} />}

      <LiveDataPanel snapshot={snapshot} loading={loading} onRefresh={loadSnapshot} />
      <EducationSection />
      <SourcesFooter />

      {shareFallbackText && (
        <div className="share-fallback" role="status" aria-live="polite">
          <div>
            <strong>Résultat prêt à partager</strong>
            <button type="button" onClick={() => setShareFallbackText("")}>
              Fermer
            </button>
          </div>
          <textarea readOnly value={shareFallbackText} onFocus={(event) => event.currentTarget.select()} />
        </div>
      )}

      <div id="copy-toast" className="copy-toast" aria-live="polite">
        {toast}
      </div>
    </main>
  );
}
