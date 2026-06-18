"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Award,
  BatteryCharging,
  Cable,
  CheckCircle2,
  Copy,
  Crosshair,
  Factory,
  Flame,
  Gauge,
  Leaf,
  Lightbulb,
  Loader2,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy,
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
  gridCities,
  gridEdges,
  missionModes,
  simulateMission,
  type ActionId,
  type CrisisChoice,
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

function effectIsGood(key: keyof MissionMetrics, value: number) {
  if (key === "blackoutRisk") return value < 0;
  return value > 0;
}

function effectChipLabel(key: keyof MissionMetrics, value: number) {
  const sign = value > 0 ? "+" : "";
  const valueText = `${sign}${value}`;

  switch (key) {
    case "stability":
      return `Stabilité ${valueText}`;
    case "blackoutRisk":
      return value < 0 ? `Risque ${value}` : `Risque +${value}`;
    case "co2Score":
      return value > 0 ? `CO2 mieux +${value}` : `CO2 pire ${value}`;
    case "budget":
      return value > 0 ? `Budget +${value}` : `Coût ${value}`;
    case "citizenTrust":
      return value > 0 ? `Confiance +${value}` : `Confiance ${value}`;
    case "lightsOn":
      return value > 0 ? `Lumières +${value}` : `Lumières ${value}`;
    default:
      return `${metricLabels[key]} ${valueText}`;
  }
}

function actionForChoice(choice: CrisisChoice): MissionAction {
  return actionById(choice.id);
}

function classifyRisk(metrics: MissionMetrics) {
  if (metrics.blackoutRisk >= 72 || metrics.stability < 42) return "danger";
  if (metrics.blackoutRisk >= 44 || metrics.stability < 65) return "tense";
  return "secure";
}

function missionClock(state: MissionState) {
  const secondsRemaining = Math.max(0, 300 - state.selectedActions.length * 52);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function threatLabel(metrics: MissionMetrics) {
  if (metrics.blackoutRisk >= 78) return "ALERTE ROUGE";
  if (metrics.blackoutRisk >= 58) return "RÉSEAU INSTABLE";
  if (metrics.blackoutRisk >= 34) return "MARGE TENDUE";
  return "CONTRÔLE REPRIS";
}

function rankName(rank: MissionState["gameRank"]) {
  return {
    S: "Légendaire",
    A: "Maîtrise",
    B: "Solide",
    C: "Sous tension",
    D: "Critique",
  }[rank];
}

function FrequencyTrace({ metrics }: { metrics: MissionMetrics }) {
  const tone = classifyRisk(metrics);
  const drift = Math.max(0, Math.min(100, 100 - metrics.stability + metrics.blackoutRisk * 0.36));

  return (
    <div className={clsx("frequency-trace", `frequency-${tone}`)} style={{ "--drift": `${drift}%` } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 220 54">
        <path className="frequency-baseline" d="M4 27 H216" />
        <path className="frequency-wave" d="M4 27 C22 12 37 12 54 27 S88 42 105 27 S139 12 156 27 S190 42 216 27" />
        <path className="frequency-spark" d="M118 27 L128 13 L137 35 L147 21" />
      </svg>
    </div>
  );
}

function MissionMotionLayer({ state, compact = false }: { state: MissionState; compact?: boolean }) {
  const showMetro = state.mode.id === "paris" && !compact;
  const showBattery = state.mode.id === "future2050" && !compact;
  const reserve = Math.max(8, Math.min(100, state.metrics.budget + state.metrics.stability * 0.28 - state.selectedActions.filter((action) => action.id === "batteries").length * 16));

  return (
    <div className="mission-motion-layer" aria-hidden="true">
      {!compact && <FrequencyTrace metrics={state.metrics} />}
      {showMetro && (
        <div className="paris-metro-pulse">
          <span />
          <span />
          <span />
        </div>
      )}
      {showBattery && (
        <div className="storage-core" style={{ "--reserve": `${reserve}%` } as CSSProperties}>
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
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
  const activeCity = state.activeScene?.cityId;
  const activeCityData = activeCity ? cityById.get(activeCity) : null;

  return (
    <div className={clsx("france-grid-map", `map-${tone}`, `map-mode-${state.mode.id}`, compact && "compact")}>
      <div className="map-vignette" aria-hidden="true" />
      <MissionMotionLayer state={state} compact={compact} />
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
          d="M49.2 5.8 C54.8 7.1 58.4 8.8 63.6 11.7 C67.6 13.9 70.5 18.1 73.5 21.7 C77.7 26.8 82.4 28.9 84.7 34.6 C87.1 40.3 84.3 46.4 84.9 51.6 C85.4 56.4 90.4 62.3 86.5 67.9 C82.8 73.2 77.5 75.8 75.6 82.3 C74.4 86.4 69.7 90.3 64.2 90.7 C57.8 91.3 53.4 87.2 47.8 86.9 C42.5 86.6 38.1 90.7 32.7 88.6 C27.3 86.6 24.8 81.8 20.8 78.8 C15.9 75.1 12.1 71.7 13.7 65.8 C15.4 59.7 18.7 56.1 16.2 49.8 C13.9 44.1 8.7 40.5 10.8 34.5 C12.7 29 18.6 27.1 20.9 22.3 C23.6 16.7 27.7 12.8 33.6 13 C39.1 13.2 43.5 4.5 49.2 5.8 Z"
        />
        <path className="corsica-mark" d="M78.7 78.2 C82.6 80.3 83.7 85.7 81.4 90.8 C80.2 93.4 77.6 96.4 75.9 94.1 C74.3 91.9 75.1 87.7 74.5 84.6 C73.9 81.4 75.4 76.4 78.7 78.2 Z" />
        <path className="border-trace" d="M20.9 22.3 C31 30 35 38 24 47 M84.9 51.6 C75 53 69 58 64.2 90.7 M13.7 65.8 C24 62 32 65 43 79" />
        {activeCityData && !compact && (
          <g className="target-reticle">
            <motion.circle
              cx={activeCityData.x}
              cy={activeCityData.y}
              r="9"
              initial={false}
              animate={{ r: [7, 13, 7], opacity: [0.86, 0.16, 0.86] }}
              transition={{ duration: 1.45, repeat: Infinity, ease: "easeOut" }}
            />
            <line x1={activeCityData.x - 12} y1={activeCityData.y} x2={activeCityData.x - 6} y2={activeCityData.y} />
            <line x1={activeCityData.x + 6} y1={activeCityData.y} x2={activeCityData.x + 12} y2={activeCityData.y} />
            <line x1={activeCityData.x} y1={activeCityData.y - 12} x2={activeCityData.x} y2={activeCityData.y - 6} />
            <line x1={activeCityData.x} y1={activeCityData.y + 6} x2={activeCityData.x} y2={activeCityData.y + 12} />
          </g>
        )}
        {gridEdges.map((edge) => {
          const from = cityById.get(edge.from);
          const to = cityById.get(edge.to);
          if (!from || !to) return null;
          const fromState = state.cityStates[from.id];
          const toState = state.cityStates[to.id];
          const weak = fromState === "off" || toState === "off" ? "off" : fromState === "fragile" || toState === "fragile" ? "fragile" : "live";

          return (
            <motion.line
              key={`${edge.from}-${edge.to}-${edge.corridor}`}
              className={clsx("grid-line", `grid-${weak}`, `corridor-${edge.corridor}`)}
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
          const cityState = state.cityStates[city.id] ?? "fragile";
          const radius = city.id === "paris" ? 3.7 : 2.8;

          return (
            <g key={city.id} className={clsx("city-node", `city-${cityState}`, activeCity === city.id && "city-active")}>
              <motion.circle
                key={`${city.id}-${cityState}-${state.selectedActions.length}`}
                className="city-relight-burst"
                cx={city.x}
                cy={city.y}
                r={radius + 1.4}
                initial={{ opacity: cityState === "off" ? 0.04 : 0.62, scale: 0.65 }}
                animate={{ opacity: 0, scale: cityState === "on" || cityState === "priority" ? 2.35 : 1.45 }}
                transition={{ duration: cityState === "on" || cityState === "priority" ? 0.72 : 0.46, ease: "easeOut" }}
              />
              <motion.circle
                cx={city.x}
                cy={city.y}
                r={radius + 2}
                initial={false}
                animate={{
                  opacity: cityState === "off" ? 0.1 : cityState === "fragile" ? [0.35, 0.8, 0.35] : cityState === "priority" ? [0.5, 0.95, 0.5] : 0.58,
                  scale: cityState === "fragile" || cityState === "priority" ? [0.92, 1.13, 0.92] : 1,
                }}
                transition={{ duration: cityState === "priority" ? 1.55 : 1.2, repeat: cityState === "fragile" || cityState === "priority" ? Infinity : 0 }}
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
      {!compact && (
        <div className="sector-strip" aria-hidden="true">
          <span>NORD</span>
          <span>OUEST</span>
          <span>SUD-EST</span>
        </div>
      )}
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
  onDemo,
  onRefresh,
}: {
  state: MissionState;
  snapshot: LiveMixSnapshot | null;
  loading: boolean;
  onStart: () => void;
  onDemo: () => void;
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
        <div className="hero-hud-strip" aria-label="Paramètres de mission">
          <span>
            <TimerReset size={15} />
            5:00
          </span>
          <span>
            <Crosshair size={15} />
            5 ordres
          </span>
          <span>
            <Trophy size={15} />
            Grade live
          </span>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-action control-action" onClick={onStart}>
            <Zap size={18} />
            Prendre le contrôle
          </button>
          <button type="button" className="secondary-action button-reset" onClick={onDemo}>
            Démo jury 90s
          </button>
        </div>
        <p className="data-note">{buildMissionFromSnapshot(snapshot)}</p>
      </div>
      <div className="hero-stage">
        <FranceGridMap state={state} />
        <div className="rank-console">
          <span>Grade potentiel</span>
          <strong>{state.gameRank}</strong>
          <em>{rankName(state.gameRank)}</em>
        </div>
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
    <section className="mode-select-section" aria-label="Choix de mission">
      <div className="play-rules">
        <div>
          <span>Comment gagner</span>
          <strong>Prends 5 décisions. Une seule par tour.</strong>
          <p>Ton job est simple : garde les villes allumées, baisse le risque blackout, et évite de sacrifier totalement le CO2, le budget ou la confiance.</p>
        </div>
        <ol aria-label="Règles rapides">
          <li>
            <strong>1</strong>
            Choisis une mission
          </li>
          <li>
            <strong>2</strong>
            Lis l&apos;alerte du tour
          </li>
          <li>
            <strong>3</strong>
            Envoie un ordre
          </li>
          <li>
            <strong>4</strong>
            Regarde la France réagir
          </li>
        </ol>
      </div>
      <div className="mode-strip">
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
              <em>{active ? "Mission sélectionnée" : "Choisir"}</em>
              <span>{mode.title}</span>
              <strong>{mode.objective}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MissionHud({ state }: { state: MissionState }) {
  const progress = (state.selectedActions.length / MAX_DECISIONS) * 100;
  const comboActive = state.selectedActions.length >= 2 && state.comboLabel !== "Premier ordre";

  return (
    <div className={clsx("game-hud", `hud-${classifyRisk(state.metrics)}`)}>
      <div className="hud-cell hud-clock">
        <span>
          <TimerReset size={15} />
          Temps crise
        </span>
        <strong>{missionClock(state)}</strong>
      </div>
      <div className="hud-cell hud-threat">
        <span>
          <AlertTriangle size={15} />
          Niveau menace
        </span>
        <strong>{threatLabel(state.metrics)}</strong>
        <FrequencyTrace metrics={state.metrics} />
      </div>
      <div className="hud-progress" aria-label={`${state.selectedActions.length} décisions prises sur ${MAX_DECISIONS}`}>
        <div>
          <span>Ordres envoyés</span>
          <strong>
            {state.selectedActions.length}/{MAX_DECISIONS}
          </strong>
        </div>
        <div className="hud-progress-track">
          <motion.span initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.22 }} />
        </div>
      </div>
      <div className={clsx("hud-cell hud-combo", comboActive && "combo-active")}>
        <span>
          <Sparkles size={15} />
          Combo
        </span>
        <strong>{state.comboLabel}</strong>
      </div>
      <div className="hud-cell hud-rank">
        <span>
          <Award size={15} />
          Grade
        </span>
        <strong>{state.gameRank}</strong>
        <em>{state.commandPoints} XP</em>
      </div>
    </div>
  );
}

function BonusObjectives({ state }: { state: MissionState }) {
  return (
    <div className="bonus-objectives" aria-label="Objectifs bonus">
      <div>
        <Sparkles size={16} />
        <strong>Objectifs bonus</strong>
      </div>
      <ul>
        {state.bonusObjectives.map((objective) => (
          <li key={objective.id} className={objective.completed ? "complete" : "pending"}>
            <span>{objective.title}</span>
            <em>{objective.text}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImpactBurst({ state }: { state: MissionState }) {
  const latest = state.steps.at(-1);
  if (!latest) return null;

  const protectedNames = (latest.choice.protect ?? [])
    .map((cityId) => gridCities.find((city) => city.id === cityId)?.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return (
    <motion.div
      key={latest.decisionNumber}
      className="impact-burst"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
    >
      <div>
        <span>Ordre #{latest.decisionNumber} exécuté</span>
        <strong>{latest.choice.title}</strong>
      </div>
      <div className="impact-deltas">
        {effectEntries(latest.choice.effect).slice(0, 3).map(({ key, label, value }) => (
          <span key={key} className={value >= 0 ? "positive" : "negative"} title={label}>
            {value > 0 ? "+" : ""}
            {value} {label.replace(" réseau", "")}
          </span>
        ))}
      </div>
      {protectedNames && (
        <p>
          <ShieldCheck size={15} />
          Secteurs sécurisés: {protectedNames}
        </p>
      )}
    </motion.div>
  );
}

function CascadeReplay({ state }: { state: MissionState }) {
  if (!state.steps.length) return null;

  return (
    <div className="cascade-replay" aria-label="Replay de la cascade">
      <div>
        <Crosshair size={17} />
        <strong>Replay cascade</strong>
      </div>
      <ol>
        {state.steps.map((step) => {
          const offCount = Object.values(step.cityStates).filter((cityState) => cityState === "off").length;
          const fragileCount = Object.values(step.cityStates).filter((cityState) => cityState === "fragile").length;

          return (
            <li key={`${step.decisionNumber}-${step.choice.title}`}>
              <span>#{step.decisionNumber}</span>
              <strong>{step.choice.title}</strong>
              <em>
                {offCount === 0 ? "0 coupure" : `${offCount} coupure${offCount > 1 ? "s" : ""}`} · {fragileCount} fragile
              </em>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CrisisChoiceCard({
  choice,
  index,
  selected,
  disabled,
  onChoose,
}: {
  choice: CrisisChoice;
  index: number;
  selected: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const action = actionForChoice(choice);
  const Icon = actionIcons[action.icon];

  return (
    <motion.button
      type="button"
      className={clsx("action-card crisis-choice-card", selected && "selected")}
      onClick={onChoose}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.985 }}
    >
      <span className="choice-topline">
        <span className="choice-number">Choix {index + 1}</span>
        <span className="action-icon">
          <Icon size={20} />
        </span>
      </span>
      <span className="action-body">
        <strong>{choice.title}</strong>
        <span>{choice.description}</span>
        <em>À savoir : {choice.tactical}</em>
      </span>
      <span className="effect-list" aria-label="Effets">
        {effectEntries(choice.effect).slice(0, 4).map(({ key, label, value }) => (
          <span key={key} className={effectIsGood(key, value) ? "positive" : "negative"} title={label}>
            {effectChipLabel(key, value)}
          </span>
        ))}
      </span>
      {(choice.protect?.length || choice.pressure?.length) && (
        <span className="tactical-tags">
          {choice.protect?.slice(0, 2).map((cityId) => (
            <span key={`protect-${cityId}`} className="tag-protect">
              Sauve {gridCities.find((city) => city.id === cityId)?.name ?? cityId}
            </span>
          ))}
          {choice.pressure?.slice(0, 1).map((cityId) => (
            <span key={`pressure-${cityId}`} className="tag-pressure">
              Fragilise {gridCities.find((city) => city.id === cityId)?.name ?? cityId}
            </span>
          ))}
        </span>
      )}
      <span className="choice-cta">
        <Zap size={15} />
        Envoyer cet ordre
      </span>
    </motion.button>
  );
}

function CrisisScenePanel({
  state,
  inputLocked,
  onChoose,
}: {
  state: MissionState;
  inputLocked: boolean;
  onChoose: (actionId: ActionId) => void;
}) {
  const scene = state.activeScene;
  const step = state.steps.at(-1);

  if (!scene) {
    return (
      <div className="crisis-panel resolved">
        <span>Mission verrouillée</span>
        <h3>Les 5 décisions sont prises.</h3>
        <p>Le réseau compile la cascade finale. Le verdict est prêt.</p>
      </div>
    );
  }

  return (
    <div className={clsx("crisis-panel", `crisis-${classifyRisk(state.metrics)}`, state.mode.id === "paris" && "crisis-paris", state.mode.id === "future2050" && "crisis-2050")}>
      <div className="blackout-alert-strip" aria-hidden="true">
        <span>BLACKOUT RISK</span>
        <em />
      </div>
      <div className="turn-brief">
        <strong>Tour {state.selectedActions.length + 1} sur {MAX_DECISIONS}</strong>
        <span>Choisis 1 ordre. Les lumières, les jauges et le score bougent immédiatement.</span>
      </div>
      <div className="crisis-kicker">
        <span>{scene.hour}</span>
        <strong>{scene.title}</strong>
      </div>
      <p className="crisis-alert">{scene.alert}</p>
      <div className="operator-line">
        <RadioTower size={17} />
        <span>{scene.operator}</span>
      </div>
      {step && (
        <p className="last-order">
          Dernier ordre: <strong>{step.choice.title}</strong>
        </p>
      )}
      <div className="actions-grid">
        {scene.choices.map((choice, index) => {
          const selected = state.steps.some((selectedStep) => selectedStep.choice === choice);

          return (
            <CrisisChoiceCard
              key={`${scene.hour}-${choice.id}-${choice.title}`}
              choice={choice}
              index={index}
              selected={selected}
              disabled={inputLocked}
              onChoose={() => onChoose(choice.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function MissionMeters({ metrics }: { metrics: MissionMetrics }) {
  return (
    <div className="meters-panel">
      <MetricMeter label="Stabilité" value={metrics.stability} />
      <MetricMeter label="Blackout" value={metrics.blackoutRisk} inverse />
      <MetricMeter label="CO2" value={metrics.co2Score} />
      <MetricMeter label="Budget" value={metrics.budget} />
      <MetricMeter label="Citoyens" value={metrics.citizenTrust} />
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
      <div className="radio-stack">
        {(state.operatorMessages.length ? state.operatorMessages.slice(-3) : ["Centre national: attente de ton premier arbitrage."]).map((message) => (
          <p key={message} className="radio-message">
            <RadioTower size={14} />
            {message}
          </p>
        ))}
      </div>
      <ol>
        {Array.from({ length: MAX_DECISIONS }, (_, index) => {
          const step = state.steps[index];

          return (
            <li key={index} className={step ? "done" : "pending"}>
              {step ? step.choice.title : `Décision ${index + 1}`}
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
  inputLocked,
}: {
  state: MissionState;
  phase: Phase;
  onChoose: (actionId: ActionId) => void;
  onFinish: () => void;
  inputLocked: boolean;
}) {
  const isComplete = state.selectedActions.length >= MAX_DECISIONS;
  const currentTurn = Math.min(state.selectedActions.length + 1, MAX_DECISIONS);

  return (
    <section id="mission" className="mission-shell">
      <div className="section-heading">
        <span>Mission active · tour {currentTurn}/{MAX_DECISIONS}</span>
        <h2>{state.mode.title}</h2>
        <p>Objectif clair : choisis 5 ordres pour empêcher la carte de France de s&apos;éteindre. Chaque carte est un compromis : elle aide quelque chose et coûte autre chose.</p>
      </div>
      <MissionHud state={state} />
      <div className="mission-layout">
        <div className="mission-visual">
          <FranceGridMap state={state} />
          <NarrativeLog state={state} />
        </div>
        <div className="mission-controls">
          <div className="decision-header">
            <div>
              <span>À jouer</span>
              <strong>{state.decisionsRemaining}</strong>
              <em>ordres</em>
            </div>
            <p>
              <strong>{state.mode.objective}</strong>
              <span>Lis l&apos;alerte, choisis une carte, puis regarde les villes se rallumer ou se fragiliser.</span>
            </p>
          </div>
          <BonusObjectives state={state} />
          <ImpactBurst state={state} />
          <MissionMeters metrics={state.metrics} />
          <CrisisScenePanel state={state} inputLocked={inputLocked} onChoose={onChoose} />
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
  const fragileCities = gridCities.filter((city) => state.cityStates[city.id] === "fragile").map((city) => city.name);
  const offCities = gridCities.filter((city) => state.cityStates[city.id] === "off").map((city) => city.name);

  return (
    <section id="resultat" className={clsx("result-section", `result-${state.result.kind}`)}>
      <div className="result-aura" aria-hidden="true" />
      <div className="result-visual">
        <FranceGridMap state={state} compact />
      </div>
      <div className="result-copy">
        <span>Verdict final</span>
        <div className="final-grade">
          <i aria-hidden="true" />
          <strong>{state.gameRank}</strong>
          <span>Grade {rankName(state.gameRank)}</span>
          <em>{state.commandPoints} XP crise</em>
        </div>
        <h2>{state.result.title}</h2>
        <p>{state.result.text}</p>
        <div className="score-lockup">
          <strong>{state.result.score}</strong>
          <span>/100</span>
        </div>
        <div className="profile-report">
          <span>Profil opérateur</span>
          <strong>{state.strategyProfile}</strong>
          <p>
            {offCities.length === 0
              ? fragileCities.length === 0
                ? "Toutes les grandes villes de la mission sont allumées."
                : `Zones encore fragiles: ${fragileCities.join(", ")}.`
              : `Zones coupées: ${offCities.join(", ")}.`}
          </p>
        </div>
        {state.achievements.length > 0 && (
          <div className="achievement-board" aria-label="Trophées débloqués">
            <div>
              <Trophy size={18} />
              <strong>Trophées débloqués</strong>
            </div>
            <ul>
              {state.achievements.map((achievement) => (
                <li key={achievement.id} className={`achievement-${achievement.tone}`}>
                  <span>{achievement.title}</span>
                  <em>{achievement.text}</em>
                </li>
              ))}
            </ul>
          </div>
        )}
        <CascadeReplay state={state} />
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
        <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">
          Natural Earth
        </a>
      </nav>
    </footer>
  );
}

export default function BlackoutApp({ initialSnapshot }: { initialSnapshot: LiveMixSnapshot }) {
  const [snapshot, setSnapshot] = useState<LiveMixSnapshot | null>(initialSnapshot);
  const [loading, setLoading] = useState(false);
  const [modeId, setModeId] = useState<MissionModeId>("france");
  const [selectedActions, setSelectedActions] = useState<ActionId[]>([]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [toast, setToast] = useState("Résultat copié");
  const [shareFallbackText, setShareFallbackText] = useState("");
  const [inputLocked, setInputLocked] = useState(false);
  const inputLockRef = useRef(false);

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
    const restoreTimer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const restoredMode = parseMode(params.get("mode"));
      const restoredActions = parseActions(params.get("actions"));
      setModeId(restoredMode);
      setSelectedActions(restoredActions);
      if (restoredActions.length >= MAX_DECISIONS || params.get("result")) {
        setPhase("result");
      }
    }, 0);
    const refreshTimer = window.setTimeout(() => {
      void loadSnapshot();
    }, 0);

    return () => {
      window.clearTimeout(restoreTimer);
      window.clearTimeout(refreshTimer);
    };
  }, [loadSnapshot]);

  useEffect(() => {
    if (phase !== "result") return;

    const scrollTimer = window.setTimeout(() => {
      document.getElementById("resultat")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);

    return () => window.clearTimeout(scrollTimer);
  }, [phase]);

  const startMission = () => {
    inputLockRef.current = false;
    setInputLocked(false);
    setPhase("mission");
    document.getElementById("mission")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startJuryDemo = () => {
    inputLockRef.current = false;
    setInputLocked(false);
    setModeId("france");
    setSelectedActions([]);
    setPhase("mission");
    window.history.replaceState(null, "", `${window.location.pathname}?demo=1`);
    document.getElementById("mission")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectMode = (nextModeId: MissionModeId) => {
    inputLockRef.current = false;
    setInputLocked(false);
    setModeId(nextModeId);
    setSelectedActions([]);
    setPhase("mission");
  };

  const chooseAction = (actionId: ActionId) => {
    if (inputLockRef.current || selectedActions.length >= MAX_DECISIONS) return;
    inputLockRef.current = true;
    setInputLocked(true);
    setPhase("mission");

    setSelectedActions((currentActions) => {
      if (currentActions.length >= MAX_DECISIONS) {
        inputLockRef.current = false;
        setInputLocked(false);
        return currentActions;
      }

      const nextActions = [...currentActions, actionId];
      window.setTimeout(() => {
        if (nextActions.length >= MAX_DECISIONS) {
          setPhase("result");
        }
        inputLockRef.current = false;
        setInputLocked(false);
      }, 280);

      return nextActions;
    });
  };

  const replay = () => {
    inputLockRef.current = false;
    setInputLocked(false);
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
    <main className={clsx("blackout-app", `app-mode-${modeId}`, `app-phase-${phase}`)}>
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
        <button type="button" className="header-cta control-action" onClick={startMission}>
          Prendre le contrôle
        </button>
      </header>

      <Hero
        state={missionState}
        snapshot={snapshot}
        loading={loading}
        onRefresh={loadSnapshot}
        onStart={startMission}
        onDemo={startJuryDemo}
      />

      <MissionSelector modeId={modeId} onSelect={selectMode} />

      <MissionExperience
        state={missionState}
        phase={phase}
        inputLocked={inputLocked}
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
