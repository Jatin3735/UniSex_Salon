import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { setScrollProgress, setPointer } from "./scrollStore.js";
import { prefersReducedMotion } from "./useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * Ties the 3D scissors story to scroll. `storyRef` is the tall wrapper that
 * spans HERO → EXPERIENCE; its scroll progress (0..1) becomes the scene's
 * `progress`. Also feeds pointer position for parallax. Fully cleaned up.
 *
 * Under reduced motion we set a static, pleasant pose (progress ≈ 0) and skip
 * all listeners.
 */
export function useScissorsScroll(storyRef) {
  useEffect(() => {
    if (prefersReducedMotion()) {
      setScrollProgress(0.05, 0);
      return undefined;
    }
    const el = storyRef.current;
    if (!el) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => setScrollProgress(self.progress, self.getVelocity()),
      });
    });

    let raf = 0;
    const onPointer = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setPointer(x, y);
      });
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointer);
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [storyRef]);
}
