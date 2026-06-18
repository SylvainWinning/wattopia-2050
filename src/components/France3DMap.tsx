"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import clsx from "clsx";
import { franceCorsicaPoints, franceMainlandPoints, franceRegionLines, type MapPoint } from "@/lib/france-map-geometry";
import { gridCities, gridEdges, type CityState, type GridCity, type MissionState } from "@/lib/blackout-game";

type France3DMapProps = {
  state: MissionState;
  compact?: boolean;
  onReady?: () => void;
};

const labelOffsets: Record<string, readonly [number, number]> = {
  lille: [3.2, 0.8],
  paris: [2.4, -1.2],
  strasbourg: [-8.4, 1.6],
  nantes: [2.2, -1.2],
  bordeaux: [-5.2, -1.8],
  lyon: [3.4, 0.8],
  toulouse: [0.8, -3.4],
  marseille: [-8.6, -3.2],
};

function toScenePoint(x: number, y: number, z = 0) {
  return new THREE.Vector3((x - 50) / 8.8, (50 - y) / 8.8, z);
}

function shapeFrom(points: readonly MapPoint[]) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    const point = toScenePoint(x, y);
    if (index === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  shape.closePath();
  return shape;
}

function cityColor(state: CityState) {
  if (state === "off") return "#ff4d5a";
  if (state === "fragile") return "#f7b733";
  if (state === "priority") return "#d7f7ff";
  return "#34d6ff";
}

function classifyRisk(state: MissionState) {
  if (state.metrics.blackoutRisk >= 72 || state.metrics.stability < 42) return "danger";
  if (state.metrics.blackoutRisk >= 44 || state.metrics.stability < 65) return "tense";
  return "secure";
}

function FranceMesh({ tone }: { tone: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const { mainland, corsica, mainlandCap, corsicaCap, boundaries } = useMemo(() => {
    const options: THREE.ExtrudeGeometryOptions = { depth: 0.34, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.05, bevelSegments: 3 };
    return {
      mainland: new THREE.ExtrudeGeometry(shapeFrom(franceMainlandPoints), options),
      corsica: new THREE.ExtrudeGeometry(shapeFrom(franceCorsicaPoints), options),
      mainlandCap: new THREE.ShapeGeometry(shapeFrom(franceMainlandPoints)),
      corsicaCap: new THREE.ShapeGeometry(shapeFrom(franceCorsicaPoints)),
      boundaries: franceRegionLines.map((line) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(line.map(([x, y]) => toScenePoint(x, y, 0.72)));
        const material = new THREE.LineBasicMaterial({ color: "#9be8ff", transparent: true, opacity: 0.18, depthTest: false });
        const boundary = new THREE.Line(geometry, material);
        boundary.renderOrder = 8;
        return boundary;
      }),
    };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.22) * 0.012;
    groupRef.current.position.z = Math.sin(clock.elapsedTime * 0.7) * 0.025;
  });

  const color = tone === "danger" ? "#1e263b" : tone === "tense" ? "#172d42" : "#12344a";

  return (
    <group ref={groupRef} rotation={[-0.28, 0.08, 0.02]} position={[0, 0, -0.08]}>
      <mesh geometry={mainland} position={[0.06, -0.08, -0.3]}>
        <meshStandardMaterial color="#050915" roughness={0.8} metalness={0.08} transparent opacity={0.66} />
      </mesh>
      <mesh geometry={corsica} position={[0.06, -0.08, -0.28]}>
        <meshStandardMaterial color="#050915" roughness={0.8} metalness={0.08} transparent opacity={0.58} />
      </mesh>
      <mesh geometry={mainland}>
        <meshStandardMaterial color={color} emissive="#0a8fbf" emissiveIntensity={tone === "danger" ? 0.1 : 0.18} roughness={0.32} metalness={0.48} transparent opacity={0.92} />
      </mesh>
      <mesh geometry={corsica} position={[0, 0, 0.02]}>
        <meshStandardMaterial color={color} emissive="#0a8fbf" emissiveIntensity={0.14} roughness={0.34} metalness={0.42} transparent opacity={0.88} />
      </mesh>
      <mesh geometry={mainlandCap} position={[0, 0, 0.365]}>
        <meshBasicMaterial color="#6ee7ff" transparent opacity={0.08} />
      </mesh>
      <mesh geometry={corsicaCap} position={[0, 0, 0.385]}>
        <meshBasicMaterial color="#6ee7ff" transparent opacity={0.07} />
      </mesh>
      {boundaries.map((boundary, index) => (
        <primitive key={index} object={boundary} />
      ))}
    </group>
  );
}

function EnergyArc({
  from,
  to,
  state,
  index,
}: {
  from: GridCity;
  to: GridCity;
  state: MissionState;
  index: number;
}) {
  const fromState = state.cityStates[from.id];
  const toState = state.cityStates[to.id];
  const weak = fromState === "off" || toState === "off" ? "off" : fromState === "fragile" || toState === "fragile" ? "fragile" : "live";
  const isNorthLink = from.id === "lille" || to.id === "lille";
  const curve = useMemo(() => {
    const start = toScenePoint(from.x, from.y, isNorthLink ? 0.58 : 0.78);
    const end = toScenePoint(to.x, to.y, isNorthLink ? 0.58 : 0.78);
    const mid = start.clone().lerp(end, 0.5);
    mid.z += isNorthLink ? 0.22 + start.distanceTo(end) * 0.025 : 0.7 + start.distanceTo(end) * 0.08;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to, isNorthLink]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 28, weak === "live" ? 0.017 : 0.012, 6, false), [curve, weak]);
  const color = weak === "off" ? "#ff4d5a" : weak === "fragile" ? "#f7b733" : "#35d7ff";

  return (
    <group>
      <mesh geometry={geometry} renderOrder={12}>
        <meshBasicMaterial color={color} transparent opacity={weak === "off" ? 0.32 : 0.72} depthTest={false} />
      </mesh>
      {weak !== "off" && <FlowDot curve={curve} color={color} phase={index * 0.14} speed={weak === "fragile" ? 0.32 : 0.45} />}
    </group>
  );
}

function FlowDot({ curve, color, phase, speed }: { curve: THREE.QuadraticBezierCurve3; color: string; phase: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const point = curve.getPoint((clock.elapsedTime * speed + phase) % 1);
    ref.current.position.copy(point);
  });

  return (
    <mesh ref={ref} renderOrder={14}>
      <sphereGeometry args={[0.045, 14, 14]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} depthTest={false} />
    </mesh>
  );
}

function CityNode({ city, state, active }: { city: GridCity; state: CityState; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = cityColor(state);
  const point = toScenePoint(city.x, city.y, city.id === "lille" ? 0.54 : 0.63);
  const baseTowerHeight = state === "off" ? 0.08 : state === "fragile" ? 0.22 : state === "priority" ? 0.42 : 0.34;
  const towerHeight = city.id === "lille" ? baseTowerHeight * 0.54 : baseTowerHeight;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = state === "fragile" || active ? Math.sin(clock.elapsedTime * 5.2) * 0.18 + 1.12 : 1;
    groupRef.current.scale.setScalar(state === "off" ? 0.82 : pulse);
  });

  return (
    <group ref={groupRef} position={point} renderOrder={16}>
      <mesh position={[0, 0, towerHeight / 2 - 0.05]} renderOrder={16}>
        <cylinderGeometry args={[city.id === "paris" ? 0.06 : 0.045, city.id === "paris" ? 0.075 : 0.052, towerHeight, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={state === "off" ? 0.12 : 0.72} roughness={0.28} metalness={0.32} transparent opacity={state === "off" ? 0.38 : 0.82} depthTest={false} />
      </mesh>
      <mesh renderOrder={17}>
        <sphereGeometry args={[city.id === "paris" ? 0.16 : 0.115, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={state === "off" ? 0.3 : active ? 2.4 : 1.45} roughness={0.24} metalness={0.2} depthTest={false} />
      </mesh>
      {active && (
        <mesh rotation={[0, 0, 0]} renderOrder={18}>
          <torusGeometry args={[city.id === "lille" ? 0.24 : 0.32, 0.012, 8, 48]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.88} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}

function HologramScene({ state }: { state: MissionState }) {
  const tone = classifyRisk(state);
  const cityById = new Map(gridCities.map((city) => [city.id, city]));
  const activeCity = state.activeScene?.cityId;

  return (
    <>
      <color attach="background" args={["#020713"]} />
      <fog attach="fog" args={["#020713", 8, 18]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[-3, 6, 7]} intensity={2.2} color="#d6f7ff" />
      <pointLight position={[0, 0, 4.2]} intensity={tone === "danger" ? 18 : 12} color={tone === "danger" ? "#ff4d5a" : "#35d7ff"} />
      <pointLight position={[-4, -3, 2.4]} intensity={3.8} color="#1ea7ff" />
      <group position={[-0.1, -0.1, 0]} scale={0.72}>
        <FranceMesh tone={tone} />
        {gridEdges.map((edge, index) => {
          const from = cityById.get(edge.from);
          const to = cityById.get(edge.to);
          if (!from || !to) return null;
          return <EnergyArc key={`${edge.from}-${edge.to}-${index}`} from={from} to={to} state={state} index={index} />;
        })}
        {gridCities.map((city) => (
          <CityNode key={city.id} city={city} state={state.cityStates[city.id] ?? "fragile"} active={activeCity === city.id} />
        ))}
      </group>
    </>
  );
}

export function France3DMap({ state, compact = false, onReady }: France3DMapProps) {
  return (
    <div className={clsx("france-3d-map", compact && "compact", `hologram-${classifyRisk(state)}`)} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, -0.35, 9.4], fov: 43, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
          onReady?.();
        }}
      >
        <HologramScene state={state} />
      </Canvas>
      <div className="france-3d-labels" aria-hidden="true">
        {gridCities.map((city) => {
          const cityState = state.cityStates[city.id] ?? "fragile";
          const [offsetX, offsetY] = labelOffsets[city.id] ?? [1.8, -1.4];
          return (
            <span
              key={city.id}
              className={clsx("france-3d-label", `label-${cityState}`, state.activeScene?.cityId === city.id && "active")}
              style={{ left: `${city.x + offsetX}%`, top: `${city.y + offsetY}%` }}
            >
              {city.name}
            </span>
          );
        })}
      </div>
      <div className="hologram-readout">
        <span>Hologramme réseau 3D</span>
        <strong>{state.metrics.blackoutRisk}% risque</strong>
      </div>
    </div>
  );
}
