import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

import ScissorsModel from "./ScissorsModel.jsx";
import SceneLighting from "./SceneLighting.jsx";
import FloatingGeometry from "./FloatingGeometry.jsx";
import { scrollStore } from "../../lib/scrollStore.js";

/**
 * Interpolate a value across ordered keyframes: [{ at: 0..1, v: [...] }].
 * Returns a lerped array for the current progress p.
 */
function lerpKeys(p, keys, out) {
  if (p <= keys[0].at) return keys[0].v;
  const last = keys[keys.length - 1];
  if (p >= last.at) return last.v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = (p - a.at) / (b.at - a.at || 1);
      for (let j = 0; j < a.v.length; j++) {
        out[j] = a.v[j] + (b.v[j] - a.v[j]) * t;
      }
      return out;
    }
  }
  return last.v;
}

/* -------------------------------------------------------------------- *
 * The scissors story, expressed as keyframes over scroll progress 0..1.
 * Each stage corresponds to a section the scissors travels through:
 * HERO(0) → CRAFT(.28) → SERVICES(.55) → EXPERIENCE(.8) → exit(1).
 * -------------------------------------------------------------------- */
const POS = [
  { at: 0.0, v: [0.3, -0.1, 0] },
  { at: 0.28, v: [-2.4, 0.4, -1] },
  { at: 0.55, v: [2.6, -0.3, -1.5] },
  { at: 0.8, v: [-1.4, 0.2, 0.5] },
  { at: 1.0, v: [0, -0.6, -3] },
];
const ROT = [
  { at: 0.0, v: [0.1, 0.4, 0] },
  { at: 0.28, v: [0.4, 1.7, 0.3] },
  { at: 0.55, v: [-0.3, 3.4, -0.4] },
  { at: 0.8, v: [0.5, 5.0, 0.2] },
  { at: 1.0, v: [0.2, 6.6, 0] },
];
const SCALE = [
  { at: 0.0, v: [1] },
  { at: 0.28, v: [0.82] },
  { at: 0.55, v: [0.7] },
  { at: 0.8, v: [1.05] },
  { at: 1.0, v: [0.5] },
];
const OPEN = [
  { at: 0.0, v: [0.35] },
  { at: 0.18, v: [0.85] },
  { at: 0.4, v: [0.15] },
  { at: 0.62, v: [0.9] },
  { at: 0.8, v: [0.3] },
  { at: 1.0, v: [0.7] },
];

function Rig({ quality }) {
  const group = useRef(null);
  const openRef = useRef(0.4);
  const tmp3 = useRef([0, 0, 0]);
  const tmp3b = useRef([0, 0, 0]);
  const tmp1 = useRef([1]);
  const tmp1b = useRef([0.4]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const p = scrollStore.progress;

    const pos = lerpKeys(p, POS, tmp3.current);
    const rot = lerpKeys(p, ROT, tmp3b.current);
    const scl = lerpKeys(p, SCALE, tmp1.current)[0];
    const open = lerpKeys(p, OPEN, tmp1b.current)[0];

    // Pointer parallax (subtle) layered onto the scroll pose.
    const px = scrollStore.pointerX * 0.25;
    const py = scrollStore.pointerY * 0.2;

    // Ease toward the target so scrubbing feels weighty, not rigid.
    const k = 1 - Math.pow(0.0015, delta); // frame-rate independent lerp
    g.position.x += (pos[0] + px - g.position.x) * k;
    g.position.y += (pos[1] - py - g.position.y) * k;
    g.position.z += (pos[2] - g.position.z) * k;

    // Scroll velocity adds a little spin flourish on the Y axis.
    const spin = THREE.MathUtils.clamp(scrollStore.velocity * 0.0004, -0.3, 0.3);
    g.rotation.x += (rot[0] + py * 0.5 - g.rotation.x) * k;
    g.rotation.y += (rot[1] + px * 0.5 + spin - g.rotation.y) * k;
    g.rotation.z += (rot[2] - g.rotation.z) * k;

    const s = g.scale.x + (scl - g.scale.x) * k;
    g.scale.setScalar(s);

    openRef.current = open;
  });

  return (
    <group ref={group}>
      <Float
        speed={1.1}
        rotationIntensity={0.25}
        floatIntensity={0.6}
        floatingRange={[-0.08, 0.08]}
      >
        <ScissorsModel openRef={openRef} quality={quality} />
      </Float>
    </group>
  );
}

/** Procedural studio environment — reflective, no network HDR fetch. */
function StudioEnv() {
  return (
    <Environment resolution={256}>
      <group rotation={[0, 0, 0]}>
        <Lightformer intensity={2.4} position={[0, 4, 3]} scale={[8, 3, 1]} color="#fff2dc" />
        <Lightformer intensity={1.6} position={[-4, 1, 2]} scale={[3, 6, 1]} color="#c9a15e" />
        <Lightformer intensity={1.2} position={[4, -1, 2]} scale={[3, 6, 1]} color="#9fb2d6" />
        <Lightformer intensity={2} position={[0, -4, 2]} scale={[8, 2, 1]} color="#ffffff" />
        <Lightformer intensity={0.8} position={[0, 0, -5]} scale={[10, 10, 1]} color="#2a2a30" />
      </group>
    </Environment>
  );
}

/**
 * Fixed full-viewport canvas that sits behind the story sections. The parent
 * fades/hides it via CSS once the story is done (see Home). `pointer-events:
 * none` so it never blocks clicks. Quality prop scales DPR + geometry.
 */
export default function ScissorsScene({ quality = 2, className = "" }) {
  const dpr = quality > 1 ? [1, 1.8] : [1, 1.3];

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 ${className}`}
      aria-hidden="true"
    >
      <Canvas
        dpr={dpr}
        gl={{ antialias: quality > 1, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 9], fov: 38 }}
        shadows={quality > 1}
      >
        <Suspense fallback={null}>
          <SceneLighting quality={quality} />
          <Rig quality={quality} />
          <FloatingGeometry quality={quality} />
          <StudioEnv />
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
