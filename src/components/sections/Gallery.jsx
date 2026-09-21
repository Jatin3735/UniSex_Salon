import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnimatedHeading from "../cinematic/AnimatedHeading.jsx";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * SECTION 6 — GALLERY. An asymmetric editorial grid (not a uniform grid):
 * frames of varying size and offset, each drifting at its own parallax rate
 * and zooming on hover with a cursor label. Composed for rhythm, not symmetry.
 */
const FRAMES = [
  { src: "/girls-hair.jpg", label: "Colour", cls: "col-span-6 sm:col-span-4 aspect-[3/4]", depth: 40, mt: "" },
  { src: "/haircut.jpg", label: "Cut", cls: "col-span-6 sm:col-span-3 aspect-[3/4]", depth: 90, mt: "sm:mt-24" },
  { src: "/beard.jpg", label: "Beard", cls: "col-span-6 sm:col-span-5 aspect-[4/3]", depth: 20, mt: "sm:mt-8" },
  { src: "/facial.jpg", label: "Facial", cls: "col-span-6 sm:col-span-5 aspect-[4/3]", depth: 70, mt: "" },
  { src: "/spa.jpg", label: "Spa", cls: "col-span-6 sm:col-span-4 aspect-[3/4]", depth: 30, mt: "sm:-mt-16" },
  { src: "/keratin.jpg", label: "Treatment", cls: "col-span-12 sm:col-span-3 aspect-[3/4]", depth: 110, mt: "sm:mt-12" },
];

export default function Gallery() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.utils.toArray("[data-frame]").forEach((frame) => {
        const depth = Number(frame.dataset.depth) || 40;
        gsap.fromTo(
          frame.querySelector("img"),
          { yPercent: -depth / 8 },
          {
            yPercent: depth / 8,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="gallery" className="relative bg-ink-800 px-6 py-32 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-8">05 — Gallery</p>
            <AnimatedHeading
              as="h2"
              text="Work from the floor"
              className="font-display text-4xl font-light text-ivory sm:text-5xl lg:text-6xl"
            />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ash">
            A living record of the chair — cuts, colour and finishes shaped in
            the house.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {FRAMES.map((f) => (
            <figure
              key={f.src + f.label}
              data-frame
              data-depth={f.depth}
              data-cursor
              data-cursor-label={f.label}
              className={`group relative overflow-hidden ${f.cls} ${f.mt}`}
            >
              <img
                src={f.src}
                alt={`${f.label} work`}
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-110 object-cover transition-transform duration-[900ms] ease-out group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-ink/10 transition-colors duration-500 group-hover:bg-ink/40" />
              <figcaption className="absolute bottom-4 left-4 translate-y-2 text-xs tracking-[0.2em] text-ivory uppercase opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                {f.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
