import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { prefersReducedMotion } from "./useReducedMotion.js";
import { setLenis, getLenis } from "./lenisInstance.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * App-wide smooth scroll. Drives Lenis from GSAP's ticker (one RAF loop, no
 * competing rAFs) and tells ScrollTrigger to update on every Lenis frame, so
 * scrubbed timelines stay perfectly in sync with the smoothed scroll.
 *
 * Disabled entirely under prefers-reduced-motion — the page falls back to
 * native scrolling, which is exactly what those users want.
 */
export default function SmoothScroll({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native scroll on touch — smoothing touch fights the OS and feels laggy.
      syncTouch: false,
      touchMultiplier: 1.5,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time) => {
      // GSAP ticker time is in seconds; Lenis wants ms.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // On navigation: honour a #hash anchor (smooth-scroll to it), otherwise jump
  // to top. Then recompute ScrollTrigger measurements for the new content.
  useEffect(() => {
    const lenis = getLenis();
    const hash = location.hash;

    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (hash) {
        const target = document.querySelector(hash);
        if (target) {
          if (lenis) lenis.scrollTo(target, { offset: -90, duration: 1.2 });
          else target.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.hash]);

  return children;
}
