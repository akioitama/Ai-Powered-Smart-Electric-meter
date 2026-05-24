"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

interface NodeDef {
  position: [number, number, number];
  anomaly: boolean;
  size: number;
}

/**
 * Smart-grid 3D network visualization.
 * Renders a constellation of nodes (homes/buildings) connected by glowing edges,
 * with a subset pulsing red to indicate anomalies, and a sweeping AI scan.
 */
export function GridNetwork() {
  return (
    <Canvas
      camera={{ position: [0, 4.2, 9], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 6, 6]} intensity={20} color="#00F0FF" />
      <pointLight position={[-6, -2, 4]} intensity={16} color="#8B5CF6" />

      <Suspense fallback={null}>
        <Network />
        <ScanSweep />
      </Suspense>
    </Canvas>
  );
}

function useNodes(): NodeDef[] {
  return useMemo(() => {
    const nodes: NodeDef[] = [];
    // Two concentric rings + center cluster
    const seed = (i: number) => Math.sin(i * 9301 + 1) * 233280;
    const rand = (i: number) => seed(i) - Math.floor(seed(i));

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      nodes.push({
        position: [Math.cos(a) * 4.2, (rand(i) - 0.5) * 0.6, Math.sin(a) * 4.2],
        anomaly: i % 7 === 3,
        size: 0.16,
      });
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      nodes.push({
        position: [Math.cos(a) * 2.4, (rand(i + 100) - 0.5) * 0.4, Math.sin(a) * 2.4],
        anomaly: i === 4,
        size: 0.14,
      });
    }
    nodes.push({ position: [0, 0, 0], anomaly: false, size: 0.22 });
    return nodes;
  }, []);
}

function Network() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * 0.08;
    }
  });

  const nodes = useNodes();

  // Edges: connect each node to its two nearest neighbors
  const edges = useMemo(() => {
    const list: Array<{ a: THREE.Vector3; b: THREE.Vector3; anomaly: boolean }> = [];
    nodes.forEach((n, i) => {
      const here = new THREE.Vector3(...n.position);
      const ranked = nodes
        .map((m, j) => ({ j, d: new THREE.Vector3(...m.position).distanceTo(here) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      ranked.forEach(({ j }) => {
        if (j > i) {
          list.push({
            a: here,
            b: new THREE.Vector3(...nodes[j].position),
            anomaly: n.anomaly || nodes[j].anomaly,
          });
        }
      });
    });
    return list;
  }, [nodes]);

  return (
    <group ref={group}>
      {/* Faint floor disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <ringGeometry args={[1.2, 5.2, 96]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Edges */}
      {edges.map((e, i) => (
        <Edge key={i} a={e.a} b={e.b} anomaly={e.anomaly} />
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <Node key={i} {...n} />
      ))}
    </group>
  );
}

function Node({ position, anomaly, size }: NodeDef) {
  const ref = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      const m = ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = anomaly ? 0.6 + Math.sin(t * 4 + position[0]) * 0.4 : 0.85;
    }
    if (haloRef.current) {
      const s = anomaly ? 1 + (Math.sin(t * 4) * 0.5 + 0.5) * 0.8 : 1.2;
      haloRef.current.scale.setScalar(s);
      const m = haloRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = anomaly ? 0.55 - ((Math.sin(t * 4) * 0.5 + 0.5) * 0.5) : 0.18;
    }
  });

  const color = anomaly ? "#FF3D6A" : "#00F0FF";
  return (
    <group position={position}>
      <mesh ref={haloRef}>
        <sphereGeometry args={[size * 1.6, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* tiny base */}
      <mesh position={[0, -size - 0.02, 0]}>
        <cylinderGeometry args={[size * 0.6, size * 0.8, 0.06, 16]} />
        <meshBasicMaterial color="#0B1024" />
      </mesh>
    </group>
  );
}

function Edge({ a, b, anomaly }: { a: THREE.Vector3; b: THREE.Vector3; anomaly: boolean }) {
  const ref = useRef<THREE.LineSegments>(null);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z], 3));
    return g;
  }, [a, b]);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.LineBasicMaterial;
      const t = state.clock.elapsedTime;
      m.opacity = anomaly
        ? 0.4 + Math.sin(t * 3 + a.x) * 0.3
        : 0.18 + Math.sin(t * 1.2 + a.z) * 0.08;
    }
  });
  return (
    <lineSegments ref={ref} geometry={geom}>
      <lineBasicMaterial color={anomaly ? "#FF3D6A" : "#00F0FF"} transparent opacity={0.3} />
    </lineSegments>
  );
}

function ScanSweep() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.6;
      const m = ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1, 5.2, 64, 1, 0, Math.PI * 0.35]} />
      <meshBasicMaterial color="#00F0FF" transparent opacity={0.22} side={THREE.DoubleSide} />
    </mesh>
  );
}
