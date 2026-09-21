import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, Scissors } from "lucide-react";
import { gsap } from "gsap";

import Magnetic from "../cinematic/Magnetic.jsx";
import { SALON } from "../../lib/salon.js";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

/**
 * HERO — the scissors float in front of / behind this type via the fixed
 * canvas. Giant clipped display headline "CRAFT YOUR SIGNATURE" rises on
 * load; CTAs are magnetic. A scroll cue nudges the story forward.
 */
export default function Hero() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.set("[data-hero-line] > span", { yPercent: 120 });
      const tl = gsap.timeline({ delay: 0.15 });
      tl.to("[data-hero-eyebrow]", { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" })
        .to(
          "[data-hero-line] > span",
          { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.12 },
          "-=0.4"
        )
        .to(
          "[data-hero-sub], [data-hero-cta], [data-hero-cue]",
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 },
          "-=0.6"
        );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const lineBase =
    "line-mask block text-[15vw] leading-[0.86] sm:text-[13vw] lg:text-[11vw] display";

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[100svh] flex-col justify-center px-6 pt-28 pb-16 sm:px-10"
    >
      {/* soft radial vignette so type reads over the canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, transparent 40%, rgba(10,10,11,0.55) 100%)",
        }}
      />

      <div className="mx-auto w-full max-w-6xl">
        <p
          data-hero-eyebrow
          className="eyebrow mb-6 flex items-center gap-3"
          style={{ opacity: 0, transform: "translateY(20px)" }}
        >
          <Scissors size={14} className="text-champagne" />
          {SALON.name} · Bengaluru unisex grooming house
        </p>

        <h1 className="font-display font-light text-ivory">
          <span data-hero-line className={lineBase}>
            <span className="inline-block">Craft your</span>
          </span>
          <span data-hero-line className={lineBase}>
            <span className="inline-block text-metal italic">signature</span>
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <p
            data-hero-sub
            className="max-w-md text-lg leading-relaxed text-ivory-dim"
            style={{ opacity: 0, transform: "translateY(20px)" }}
          >
            Precision cuts, colour and grooming — shaped by master stylists and
            booked on a real calendar. No phone call. No double-booking.
          </p>

          <div
            data-hero-cta
            className="flex flex-wrap items-center gap-4"
            style={{ opacity: 0, transform: "translateY(20px)" }}
          >
            <Magnetic strength={0.5}>
              <Link
                to="/services"
                data-cursor-label="Book"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-ivory px-8 py-4 text-sm font-semibold tracking-wide text-ink uppercase transition-colors"
              >
                <span className="relative z-10">Book an appointment</span>
                <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowDown size={16} className="-rotate-45" />
                </span>
              </Link>
            </Magnetic>

            <Magnetic strength={0.4}>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-7 py-4 text-sm font-medium tracking-wide text-ivory uppercase transition-colors hover:border-ivory/60"
              >
                Explore services
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        data-hero-cue
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-ivory/50"
        style={{ opacity: 0 }}
        aria-hidden="true"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={16} />
        </motion.span>
      </motion.div>
    </section>
  );
}
