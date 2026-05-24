"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Sparkles, Torus, RoundedBox } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * 3D smart-meter hero scene.
 * Procedurally built (no model assets) — slowly rotates with floating animation,
 * scanning rings and sparkles.
 */
export function MeterScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 5.4], fov: 38 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 4, 4]} intensity={28} color="#00F0FF" />
      <pointLight position={[-4, -3, 3]} intensity={22} color="#8B5CF6" />
      <pointLight position={[0, 2, -4]} intensity={14} color="#FF3DCC" />

      <Suspense fallback={null}>
        <Float floatIntensity={1.4} rotationIntensity={0.6} speed={1.4}>
          <Meter />
        </Float>

        <ScanningRings />

        <Sparkles
          count={80}
          size={3}
          scale={[7, 7, 7]}
          speed={0.4}
          color="#00F0FF"
          opacity={0.7}
        />

        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}

function Meter() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * 0.18;
    }
  });

  return (
    <group ref={group}>
      {/* Outer chassis */}
      <RoundedBox args={[2.2, 2.8, 0.55]} radius={0.18} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#0B1024"
          metalness={0.9}
          roughness={0.25}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
          reflectivity={0.6}
          envMapIntensity={1.2}
        />
      </RoundedBox>

      {/* Inner faceplate */}
      <RoundedBox args={[1.85, 2.1, 0.05]} radius={0.1} smoothness={6} position={[0, 0.15, 0.28]}>
        <meshPhysicalMaterial
          color="#070B18"
          metalness={0.5}
          roughness={0.35}
          emissive="#001b22"
          emissiveIntensity={0.35}
        />
      </RoundedBox>

      {/* HUD screen (emissive) */}
      <mesh position={[0, 0.5, 0.32]}>
        <planeGeometry args={[1.5, 0.95]} />
        <meshBasicMaterial color="#001a26" />
      </mesh>
      <mesh position={[0, 0.5, 0.33]}>
        <planeGeometry args={[1.5, 0.95]} />
        <meshBasicMaterial transparent color="#00F0FF" opacity={0.18} />
      </mesh>
      <HudGrid position={[0, 0.5, 0.34]} />
      <HudReadout position={[0, 0.5, 0.36]} />

      {/* Power rings */}
      <Torus args={[0.38, 0.025, 16, 96]} position={[0, -0.85, 0.32]}>
        <meshBasicMaterial color="#00F0FF" />
      </Torus>
      <Torus args={[0.5, 0.012, 16, 96]} position={[0, -0.85, 0.32]}>
        <meshBasicMaterial color="#8B5CF6" />
      </Torus>

      {/* Status LEDs */}
      <StatusLed position={[-0.7, -0.35, 0.34]} color="#00F0FF" />
      <StatusLed position={[0, -0.35, 0.34]} color="#A6FF00" />
      <StatusLed position={[0.7, -0.35, 0.34]} color="#FF3DCC" />

      {/* Vents */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -1.18 + i * 0.05, 0.32]}>
          <boxGeometry args={[0.9, 0.018, 0.01]} />
          <meshBasicMaterial color="#0c2530" />
        </mesh>
      ))}

      {/* Top mount */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 0.25, 24]} />
        <meshPhysicalMaterial color="#0B1024" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Conduit cables */}
      <Cable position={[-0.55, -1.4, 0]} />
      <Cable position={[0.55, -1.4, 0]} />
    </group>
  );
}

function HudGrid({ position }: { position: [number, number, number] }) {
  const rows = 4;
  const cols = 8;
  const lines: JSX.Element[] = [];
  for (let i = 1; i < rows; i++) {
    const y = (i / rows - 0.5) * 0.95;
    lines.push(
      <mesh key={`r${i}`} position={[0, y, 0]}>
        <planeGeometry args={[1.5, 0.005]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.35} />
      </mesh>,
    );
  }
  for (let i = 1; i < cols; i++) {
    const x = (i / cols - 0.5) * 1.5;
    lines.push(
      <mesh key={`c${i}`} position={[x, 0, 0]}>
        <planeGeometry args={[0.005, 0.95]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.25} />
      </mesh>,
    );
  }
  return <group position={position}>{lines}</group>;
}

function HudReadout({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }
  });
  return (
    <group position={position}>
      {[0.36, 0.18, 0.0, -0.18, -0.36].map((y, i) => (
        <mesh
          key={i}
          position={[(-0.25 + (i % 3) * 0.18) * (i % 2 === 0 ? 1 : -1), y, 0]}
          ref={i === 2 ? ref : undefined}
        >
          <planeGeometry args={[0.7 + (i % 3) * 0.18, 0.04]} />
          <meshBasicMaterial color="#00F0FF" transparent opacity={0.6 - i * 0.08} />
        </mesh>
      ))}
    </group>
  );
}

function StatusLed({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 3 + position[0] * 4) * 0.4;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function Cable({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.06, 0.08, 0.45, 16]} />
      <meshPhysicalMaterial color="#0B1024" metalness={0.4} roughness={0.6} />
    </mesh>
  );
}

function ScanningRings() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = -Math.PI / 2;
      ref.current.rotation.z = state.clock.elapsedTime * 0.4;
    }
  });

  const rings = useMemo(
    () =>
      [1.6, 2.1, 2.8, 3.6].map((r, i) => ({
        radius: r,
        opacity: 0.6 - i * 0.12,
        color: i % 2 === 0 ? "#00F0FF" : "#8B5CF6",
      })),
    [],
  );

  return (
    <group ref={ref} position={[0, -1.3, 0]}>
      {rings.map((ring, i) => (
        <Torus key={i} args={[ring.radius, 0.008, 8, 128]}>
          <meshBasicMaterial color={ring.color} transparent opacity={ring.opacity} />
        </Torus>
      ))}
    </group>
  );
}
