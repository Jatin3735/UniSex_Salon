import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnimatedHeading from "../cinematic/AnimatedHeading.jsx";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * SECTION 4 — SIGNATURE EXPERIENCE. A full-bleed immersive frame: a large
 * salon image scales/parallaxes behind a masked headline, with a scrim so
 * the type stays legible. Depth comes from differing scroll rates on the
 * image vs. the copy.
 */
export default function Experience() {
  const rootRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgRef.current,
        { scale: 1.25, yPercent: -8 },
        {
          scale: 1.05,
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="experience"
      className="grain relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      <img
        ref={imgRef}
        src="/spa.jpg"
        alt="The salon interior at golden hour"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 50%, transparent 30%, rgba(10,10,11,0.85) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <p className="eyebrow mb-8">03 — The experience</p>
        <AnimatedHeading
          as="h2"
          text="Time slows down in the chair."
          className="font-display text-4xl leading-[1.05] font-light text-ivory sm:text-6xl lg:text-7xl"
          stagger={0.08}
        />
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-ivory-dim">
          Low light, quiet hands, the scent of warm towels. We build the room
          around the ritual, so the twenty minutes you spend here feel like an
          hour to yourself.
        </p>
      </div>
    </section>
  );
}
