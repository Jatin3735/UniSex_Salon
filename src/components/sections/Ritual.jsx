import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnimatedHeading from "../cinematic/AnimatedHeading.jsx";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  { n: "01", title: "Consult", copy: "We read your hair, your face and your routine before a single cut." },
  { n: "02", title: "Craft", copy: "Section by section, the shape is built with unhurried precision." },
  { n: "03", title: "Refine", copy: "We check the light, the fall, the line — and adjust until it's right." },
  { n: "04", title: "Reveal", copy: "The mirror turns. You leave with a look that keeps its shape." },
];

/**
 * SECTION 5 — THE RITUAL. Four stages revealed on scroll, threaded by a
 * champagne progress line that draws itself as the section enters. Each row
 * rises and fades in sequence.
 */
export default function Ritual() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      // Draw the vertical progress line
      gsap.fromTo(
        "[data-ritual-line]",
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "top",
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: true,
          },
        }
      );

      gsap.utils.toArray("[data-stage]").forEach((row) => {
        gsap.from(row, {
          y: 60,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: row, start: "top 82%", once: true },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="ritual" className="relative px-6 py-32 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 max-w-2xl">
          <p className="eyebrow mb-8">04 — The ritual</p>
          <AnimatedHeading
            as="h2"
            text="Four movements, one signature."
            className="font-display text-4xl font-light text-ivory sm:text-5xl lg:text-6xl"
          />
        </div>

        <div className="relative pl-8 sm:pl-0">
          {/* progress line */}
          <span
            data-ritual-line
            aria-hidden="true"
            className="absolute top-2 left-0 h-full w-px bg-champagne sm:left-[10.5rem]"
          />

          <ol className="space-y-16">
            {STAGES.map((stage) => (
              <li
                key={stage.n}
                data-stage
                className="grid gap-4 sm:grid-cols-[10.5rem_1fr] sm:items-baseline sm:gap-10"
              >
                <div className="flex items-center gap-4 sm:justify-end sm:pr-10">
                  <span className="font-display text-5xl text-metal sm:text-6xl">{stage.n}</span>
                </div>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute top-3 -left-8 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-champagne sm:-left-10"
                  />
                  <h3 className="font-display text-2xl text-ivory sm:text-3xl">{stage.title}</h3>
                  <p className="mt-2 max-w-md text-base leading-relaxed text-ivory-dim">
                    {stage.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
