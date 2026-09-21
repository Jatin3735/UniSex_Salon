import { useEffect, useRef } from "react";
import { gsap } from "gsap";

import { useDeviceTier } from "../../lib/useDeviceTier.js";

/**
 * Subtle two-part cursor: a hard dot that tracks 1:1 and a soft ring that
 * eases behind it. The ring grows over interactive elements (anything with
 * [data-cursor] or a/button). An optional label reads [data-cursor-label].
 *
 * Desktop only — bails on touch/low tier and never hides the native cursor
 * there. Uses quickTo for GPU-cheap tracking, cleaned up on unmount.
 */
export default function Cursor() {
  const tier = useDeviceTier();
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (tier === "low") return undefined;
    if (window.matchMedia?.("(pointer: coarse)").matches) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring) return undefined;

    document.body.classList.add("cursor-active");

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

    let visible = false;
    const show = () => {
      if (visible) return;
      visible = true;
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
    };
    const onMove = (e) => {
      show();
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const interactiveSel = "a, button, [data-cursor], input, textarea, select, [role='button']";
    const onOver = (e) => {
      const el = e.target.closest?.(interactiveSel);
      if (el) {
        ring.classList.add("is-hover");
        const text = el.getAttribute("data-cursor-label");
        if (text && label) {
          label.textContent = text;
          gsap.to(label, { autoAlpha: 1, duration: 0.2 });
        }
      }
    };
    const onOut = (e) => {
      const el = e.target.closest?.(interactiveSel);
      if (el) {
        ring.classList.remove("is-hover");
        if (label) gsap.to(label, { autoAlpha: 0, duration: 0.2 });
      }
    };
    // On leave, hide AND reset the flag — otherwise `visible` stays true and
    // the next pointermove skips the fade-back-in, leaving the page with no
    // cursor at all (the native one is hidden by body.cursor-active). This was
    // the "sometimes disappears" bug: any trip out of the window (alt-tab,
    // second monitor, browser chrome, an iframe like the map) killed it.
    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    // pointerleave on the document element is more reliable than mouseleave on
    // document, and re-entry (pointerenter) restores the cursor immediately
    // rather than waiting for the first move.
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", show);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", show);
      document.body.classList.remove("cursor-active");
    };
  }, [tier]);

  if (tier === "low") return null;

  return (
    <>
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0, visibility: "hidden" }}>
        <span
          ref={labelRef}
          className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tracking-wider text-white uppercase"
          style={{ opacity: 0, visibility: "hidden", mixBlendMode: "normal" }}
        />
      </div>
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0, visibility: "hidden" }} />
    </>
  );
}
