"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import clsx from "clsx";
import { gridCities, gridEdges, type CityState, type GridCity, type MissionState } from "@/lib/blackout-game";

type France3DMapProps = {
  state: MissionState;
  compact?: boolean;
  onReady?: () => void;
};

const mainlandPoints = [
  [48.7, 4.9],
  [54.4, 7.2],
  [59.9, 7.7],
  [64.8, 11.1],
  [68.4, 16.6],
  [73.7, 18.4],
  [75.6, 23.2],
  [80.8, 26.5],
  [82.3, 31.8],
  [87.2, 34.7],
  [85.9, 40.5],
  [88.5, 46.5],
  [85.7, 51.6],
  [88.1, 57.7],
  [84.4, 63.1],
  [85.9, 68.7],
  [80.5, 72.2],
  [77.1, 78.5],
  [72.2, 80.1],
  [70.2, 86.3],
  [63.5, 90.5],
  [56.9, 88.9],
  [50.4, 91.9],
  [44.8, 88.5],
  [38.1, 89.4],
  [33.7, 84.5],
  [27.6, 83.2],
  [24.8, 77.8],
  [18.7, 75.8],
  [16.8, 70.1],
  [11.8, 66.7],
  [14.8, 59.9],
  [12.9, 54.2],
  [16.9, 48.8],
  [12.1, 43.1],
  [9.2, 36.1],
  [13.8, 30.6],
  [18.4, 27.2],
  [19.9, 20.8],
  [26.1, 18.2],
  [30.9, 12.7],
  [37.8, 14.4],
  [43.1, 9.4],
] as const;

const corsicaPoints = [
  [79.3, 77.1],
  [82.1, 80.8],
  [82.6, 86.1],
  [80.4, 92.5],
  [76.7, 96.1],
  [74.5, 92.3],
  [75.2, 86.9],
  [73.9, 82.4],
  [76.2, 78.1],
] as const;

const regionLines = [
  [
    [22, 28],
    [45, 36],
    [74, 26],
  ],
  [
    [45, 36],
    [38, 68],
    [58, 89],
  ],
  [
    [45, 36],
    [62, 64],
    [84, 58],
  ],
  [
    [25, 77],
    [38, 55],
    [68, 17],
  ],
  [
    [18, 49],
    [45, 48],
    [85, 52],
  ],
] as const;

function toScenePoint(x: number, y: number, z = 0) {
  return new THREE.Vector3((x - 50) / 9, (50 - y) / 9, z);
}

function shapeFrom(points: readonly (readonly [number, number])[]) {
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
  if (state === "priority") return "#a78bfa";
  return "#34d6ff";
}

function classifyRisk(state: MissionState) {
  if (state.metrics.blackoutRisk >= 72 || state.metrics.stability < 42) return "danger";
  if (state.metrics.blackoutRisk >= 44 || state.metrics.stability < 65) return "tense";
  return "secure";
}

function FranceMesh({ tone }: { tone: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const { mainland, corsica, boundaries } = useMemo(() => {
    const options: THREE.ExtrudeGeometryOptions = { depth: 0.26, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2 };
    return {
      mainland: new THREE.ExtrudeGeometry(shapeFrom(mainlandPoints), options),
      corsica: new THREE.ExtrudeGeometry(shapeFrom(corsicaPoints), options),
      boundaries: regionLines.map((line) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(line.map(([x, y]) => toScenePoint(x, y, 0.34)));
        const material = new THREE.LineBasicMaterial({ color: "#55d7ff", transparent: true, opacity: 0.18 });
        return new THREE.Line(geometry, material);
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
      <mesh geometry={mainland}>
        <meshStandardMaterial color={color} emissive="#0a8fbf" emissiveIntensity={tone === "danger" ? 0.12 : 0.22} roughness={0.36} metalness={0.38} transparent opacity={0.9} />
      </mesh>
      <mesh geometry={corsica} position={[0, 0, 0.02]}>
        <meshStandardMaterial color={color} emissive="#0a8fbf" emissiveIntensity={0.18} roughness={0.38} metalness={0.36} transparent opacity={0.86} />
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
  const curve = useMemo(() => {
    const start = toScenePoint(from.x, from.y, 0.42);
    const end = toScenePoint(to.x, to.y, 0.42);
    const mid = start.clone().lerp(end, 0.5);
    mid.z += 0.42 + start.distanceTo(end) * 0.08;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 28, weak === "live" ? 0.017 : 0.012, 6, false), [curve, weak]);
  const color = weak === "off" ? "#ff4d5a" : weak === "fragile" ? "#f7b733" : "#35d7ff";

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} transparent opacity={weak === "off" ? 0.28 : 0.58} />
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
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 14, 14]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} />
    </mesh>
  );
}

function CityNode({ city, state, active }: { city: GridCity; state: CityState; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = cityColor(state);
  const point = toScenePoint(city.x, city.y, 0.63);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = state === "fragile" || active ? Math.sin(clock.elapsedTime * 5.2) * 0.18 + 1.12 : 1;
    groupRef.current.scale.setScalar(state === "off" ? 0.82 : pulse);
  });

  return (
    <group ref={groupRef} position={point}>
      <mesh>
        <sphereGeometry args={[city.id === "paris" ? 0.16 : 0.115, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={state === "off" ? 0.3 : active ? 2.4 : 1.45} roughness={0.24} metalness={0.2} />
      </mesh>
      {active && (
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.32, 0.012, 8, 48]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.88} />
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
      <ambientLight intensity={0.7} />
      <directionalLight position={[0, 5, 6]} intensity={1.8} color="#9be8ff" />
      <pointLight position={[0, 0, 3.8]} intensity={tone === "danger" ? 18 : 12} color={tone === "danger" ? "#ff4d5a" : "#35d7ff"} />
      <group position={[0, -0.08, 0]} scale={0.86}>
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
        camera={{ position: [0, -0.4, 8.6], fov: 42, near: 0.1, far: 40 }}
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
          return (
            <span
              key={city.id}
              className={clsx("france-3d-label", `label-${cityState}`, state.activeScene?.cityId === city.id && "active")}
              style={{ left: `${city.x}%`, top: `${city.y}%` }}
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
