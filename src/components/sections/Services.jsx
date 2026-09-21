import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import AnimatedHeading from "../cinematic/AnimatedHeading.jsx";
import { SERVICE_SHOWCASE } from "../../lib/servicesShowcase.js";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";
import { useDeviceTier } from "../../lib/useDeviceTier.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * SECTION 3 — SERVICES. A pinned horizontal-scroll rail of tall editorial
 * panels: the section pins and vertical scroll is translated into horizontal
 * travel across the cards. On touch / reduced motion it degrades to a native
 * horizontal swipe rail (no pin), which is the better mobile experience.
 */
export default function Services() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const tier = useDeviceTier();

  useEffect(() => {
    if (prefersReducedMotion() || tier === "low") return undefined;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return undefined;

    const ctx = gsap.context(() => {
      const getDistance = () => track.scrollWidth - window.innerWidth;

      gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [tier]);

  const horizontal = !prefersReducedMotion() && tier !== "low";

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative overflow-hidden bg-ink-800 py-24"
    >
      <div className="mx-auto mb-14 flex max-w-6xl items-end justify-between px-6 sm:px-10">
        <div>
          <p className="eyebrow mb-6">02 — Services</p>
          <AnimatedHeading
            as="h2"
            text="The work of the house"
            className="font-display text-4xl font-light text-ivory sm:text-5xl lg:text-6xl"
          />
        </div>
        <Link
          to="/services"
          data-cursor
          className="hidden shrink-0 items-center gap-2 text-sm tracking-wide text-ivory-dim uppercase transition-colors hover:text-champagne sm:flex"
        >
          Full menu <ArrowRight size={15} />
        </Link>
      </div>

      <div
        ref={trackRef}
        className={
          horizontal
            ? "flex w-max gap-6 px-6 sm:px-10"
            : "flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 sm:px-10 [scrollbar-width:none]"
        }
      >
        {SERVICE_SHOWCASE.map((s) => (
          <ServicePanel key={s.n} service={s} />
        ))}
      </div>
    </section>
  );
}

function ServicePanel({ service }) {
  const ref = useRef(null);
  const imgRef = useRef(null);

  const onMove = (e) => {
    const img = imgRef.current;
    if (!img || prefersReducedMotion()) return;
    const rect = ref.current.getBoundingClientRect();
    const rx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const ry = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
    gsap.to(img, { x: rx, y: ry, scale: 1.12, duration: 0.6, ease: "power3.out" });
  };
  const onLeave = () => {
    if (imgRef.current) gsap.to(imgRef.current, { x: 0, y: 0, scale: 1.05, duration: 0.6 });
  };

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor
      data-cursor-label="View"
      className="group relative h-[68vh] w-[80vw] shrink-0 snap-center overflow-hidden sm:w-[46vw] lg:w-[32vw]"
    >
      <img
        ref={imgRef}
        src={service.image}
        alt={service.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full scale-105 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-between p-8">
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl text-ivory/70">{service.n}</span>
          <span className="rounded-full border border-ivory/20 px-3 py-1 text-[10px] tracking-[0.2em] text-ivory/80 uppercase backdrop-blur">
            {service.tag}
          </span>
        </div>

        <div>
          <h3 className="font-display text-3xl font-light text-ivory sm:text-4xl">
            {service.title}
          </h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory-dim opacity-0 transition-all duration-500 group-hover:opacity-100">
            {service.copy}
          </p>
          <Link
            to="/services"
            className="mt-5 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-champagne uppercase"
          >
            Book this <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
