import { useEffect, useState } from "react";

/**
 * Coarse device-capability tier used to scale the 3D scene and effects.
 *
 *  - "low"    : touch / small / low-core / reduced-motion → simplest scene, no cursor
 *  - "mid"    : tablets, modest laptops
 *  - "high"   : desktop with a real pointer and decent cores
 *
 * Deliberately conservative and computed once (capabilities don't change
 * mid-session in any way we care about).
 */
function detectTier() {
  if (typeof window === "undefined") return "high";

  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const noHover = window.matchMedia?.("(hover: none)").matches;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const narrow = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = navigator.deviceMemory ?? 8;

  if (reduced || narrow || (coarse && noHover) || cores <= 4 || mem <= 4) {
    return coarse || narrow ? "low" : "mid";
  }
  if (window.innerWidth < 1180 || cores <= 6) return "mid";
  return "high";
}

export function useDeviceTier() {
  const [tier, setTier] = useState(detectTier);

  useEffect(() => {
    // Re-evaluate once after mount (deviceMemory etc. are stable, but width
    // can differ from SSR guess). Also react to orientation/resize crossing
    // the mobile breakpoint.
    const update = () => setTier(detectTier());
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return tier;
}
