import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

import { scrollStore } from "../../lib/scrollStore.js";

/**
 * Ambient 3D accents that orbit behind the hero scissors — a scatter of
 * polished rings, spheres and capsules in the house palette (champagne, silver,
 * ivory). They add depth and motion to the landing without competing with the
 * scissors: smaller, further back, slowly rotating, and drifting with scroll +
 * pointer parallax like the rest of the scene.
 *
 * Everything is procedural (no asset fetch) and quality-gated — geometry
 * segment counts scale down on lower tiers, matching ScissorsModel.
 */

// Deterministic scatter so the layout is stable between renders. Positions are
// spread around the scissors (which lives near origin) and pushed back in Z.
const SHAPES = [
  { kind: "ring", pos: [-4.2, 1.8, -3.5], scale: 0.9, color: "champagne", speed: 1.3, rot: 0.4 },
  { kind: "sphere", pos: [4.6, 2.4, -4.2], scale: 0.55, color: "silver", speed: 1.6, rot: 0.2 },
  { kind: "torus", pos: [3.8, -2.6, -3.0], scale: 0.7, color: "ivory", speed: 1.1, rot: 0.6 },
  { kind: "capsule", pos: [-4.8, -1.6, -4.5], scale: 0.8, color: "silver", speed: 1.4, rot: 0.5 },
  { kind: "sphere", pos: [-2.4, 3.2, -5.0], scale: 0.42, color: "champagne", speed: 1.8, rot: 0.3 },
  { kind: "octa", pos: [2.6, 3.0, -4.8], scale: 0.6, color: "ivory", speed: 1.2, rot: 0.7 },
  { kind: "ring", pos: [5.0, -0.6, -5.2], scale: 0.55, color: "silver", speed: 1.5, rot: 0.45 },
  { kind: "capsule", pos: [-5.2, 2.8, -5.5], scale: 0.5, color: "champagne", speed: 1.7, rot: 0.35 },
];

function useAccentMaterials() {
  return useMemo(() => {
    const champagne = new THREE.MeshStandardMaterial({
      color: "#c9a15e",
      metalness: 1,
      roughness: 0.2,
      envMapIntensity: 1.3,
    });
    const silver = new THREE.MeshStandardMaterial({
      color: "#c9cdd4",
      metalness: 1,
      roughness: 0.15,
      envMapIntensity: 1.4,
    });
    const ivory = new THREE.MeshStandardMaterial({
      color: "#f4efe6",
      metalness: 0.6,
      roughness: 0.35,
      envMapIntensity: 1.1,
    });
    return { champagne, silver, ivory };
  }, []);
}

function AccentGeometry({ kind, quality }) {
  const hi = quality > 1;
  switch (kind) {
    case "ring":
      return <torusGeometry args={[0.7, 0.12, hi ? 20 : 10, hi ? 64 : 28]} />;
    case "torus":
      return <torusKnotGeometry args={[0.5, 0.16, hi ? 128 : 48, hi ? 16 : 8]} />;
    case "sphere":
      return <sphereGeometry args={[0.6, hi ? 48 : 16, hi ? 48 : 16]} />;
    case "capsule":
      return <capsuleGeometry args={[0.22, 0.7, hi ? 8 : 4, hi ? 16 : 8]} />;
    case "octa":
      return <octahedronGeometry args={[0.7, 0]} />;
    default:
      return <sphereGeometry args={[0.5, 16, 16]} />;
  }
}

function Accent({ shape, material, quality }) {
  const ref = useRef(null);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    // Gentle continuous tumble, plus a nudge from scroll velocity so the whole
    // field reacts to scrolling like the scissors do.
    const spin = THREE.MathUtils.clamp(scrollStore.velocity * 0.0002, -0.15, 0.15);
    g.rotation.x += delta * shape.rot * 0.4;
    g.rotation.y += delta * shape.rot * 0.6 + spin;
  });

  return (
    <Float speed={shape.speed} rotationIntensity={0.4} floatIntensity={0.9} floatingRange={[-0.15, 0.15]}>
      <mesh ref={ref} position={shape.pos} scale={shape.scale} material={material} castShadow>
        <AccentGeometry kind={shape.kind} quality={quality} />
      </mesh>
    </Float>
  );
}

export default function FloatingGeometry({ quality = 2 }) {
  const materials = useAccentMaterials();
  const groupRef = useRef(null);

  // The whole field drifts subtly with the pointer for parallax depth.
  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const k = 1 - Math.pow(0.02, delta);
    g.position.x += (scrollStore.pointerX * 0.4 - g.position.x) * k;
    g.position.y += (-scrollStore.pointerY * 0.3 - g.position.y) * k;
  });

  // On the lower tier, thin the field out so we don't add many draw calls.
  const shapes = quality > 1 ? SHAPES : SHAPES.filter((_, i) => i % 2 === 0);

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <Accent key={i} shape={shape} material={materials[shape.color]} quality={quality} />
      ))}
    </group>
  );
}
