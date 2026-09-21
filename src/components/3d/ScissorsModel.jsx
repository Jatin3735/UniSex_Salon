import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A stylized pair of professional salon scissors, built procedurally from
 * Three.js geometry (no external asset needed). Each half — a tapered blade,
 * a neck, a shank and a finger ring — is a group we can rotate about the
 * shared pivot to open/close the blades.
 *
 * `openAmount` (0..1) drives the shear angle; `quality` scales segment counts
 * for lower-powered devices. The whole thing is polished metal via
 * MeshStandardMaterial with low roughness + high metalness, so it needs an
 * environment map (supplied by the scene) to read as chrome.
 */

// ---- shared materials -------------------------------------------------
function useMetals() {
  return useMemo(() => {
    const polished = new THREE.MeshStandardMaterial({
      color: "#dfe3e8",
      metalness: 1,
      roughness: 0.12,
      envMapIntensity: 1.4,
    });
    const brushed = new THREE.MeshStandardMaterial({
      color: "#aeb4bd",
      metalness: 0.95,
      roughness: 0.32,
      envMapIntensity: 1.1,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: "#c9a15e",
      metalness: 1,
      roughness: 0.22,
      envMapIntensity: 1.3,
    });
    return { polished, brushed, gold };
  }, []);
}

/**
 * One blade-half as a flat, tapered profile extruded to give it thickness,
 * plus a torus finger ring. Built along +X (blade tip at +X), pivot at origin.
 */
function BladeHalf({ material, ringMaterial, quality, mirror = false }) {
  const geo = useMemo(() => {
    // Blade profile: a long thin triangle-ish shape in the XY plane.
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.16);
    shape.lineTo(3.0, -0.015); // tip (thin)
    shape.lineTo(3.02, 0.02);
    shape.lineTo(0.2, 0.22); // spine near pivot (thick)
    shape.lineTo(-0.1, 0.05);
    shape.closePath();

    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: quality > 1 ? 3 : 1,
      steps: 1,
    });
    extrude.center();
    // Re-position so pivot (x≈0) sits near mesh origin after centering.
    extrude.translate(1.45, 0.02, 0);
    return extrude;
  }, [quality]);

  const ringSegments = quality > 1 ? 48 : 20;

  return (
    <group>
      {/* Blade */}
      <mesh geometry={geo} material={material} castShadow />
      {/* Neck bridging blade to shank/ring, behind the pivot (−X) */}
      <mesh position={[-0.85, 0.16, 0]} rotation={[0, 0, 0.34]} material={material} castShadow>
        <boxGeometry args={[1.5, 0.16, 0.11]} />
      </mesh>
      {/* Finger ring */}
      <mesh position={[-1.9, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} material={ringMaterial} castShadow>
        <torusGeometry args={[0.42, 0.075, quality > 1 ? 20 : 10, ringSegments]} />
      </mesh>
      {/* subtle inner accent on ring */}
      <mesh position={[-1.9, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} material={material}>
        <torusGeometry args={[0.34, 0.02, 8, ringSegments]} />
      </mesh>
      {mirror ? null : null}
    </group>
  );
}

export default function ScissorsModel({ openRef, openAmount = 0.5, quality = 2, ...props }) {
  const { polished, brushed, gold } = useMetals();
  const upperRef = useRef(null);
  const lowerRef = useRef(null);

  // Blades open symmetrically about the pivot (Z axis rotation in the XY
  // plane). shear 0 = closed, 1 = ~22° apart. Read live from the parent's ref
  // when provided (avoids reading a ref during render), else the static prop.
  useFrame(() => {
    const amount = openRef ? openRef.current : openAmount;
    const spread = THREE.MathUtils.clamp(amount, 0, 1) * 0.38;
    if (upperRef.current) upperRef.current.rotation.z = THREE.MathUtils.lerp(upperRef.current.rotation.z, spread, 0.12);
    if (lowerRef.current) lowerRef.current.rotation.z = THREE.MathUtils.lerp(lowerRef.current.rotation.z, -spread, 0.12);
  });

  return (
    <group {...props} rotation={[0, 0, -0.35]}>
      {/* Upper half */}
      <group ref={upperRef}>
        <BladeHalf material={polished} ringMaterial={gold} quality={quality} />
      </group>

      {/* Lower half (mirrored across X so the second blade sits below) */}
      <group ref={lowerRef} scale={[1, -1, 1]}>
        <BladeHalf material={brushed} ringMaterial={gold} quality={quality} mirror />
      </group>

      {/* Pivot screw */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={gold} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.24, quality > 1 ? 32 : 16]} />
      </mesh>
      <mesh position={[0, 0, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={polished}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
      </mesh>
    </group>
  );
}
