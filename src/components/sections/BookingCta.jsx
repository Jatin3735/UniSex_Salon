import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import AnimatedHeading from "../cinematic/AnimatedHeading.jsx";
import Magnetic from "../cinematic/Magnetic.jsx";
import { SALON } from "../../lib/salon.js";

/**
 * SECTION 8 — BOOKING. The commitment moment. Giant display type over an
 * ambient grid, with a magnetic primary CTA that enters the real booking
 * flow at /services (Step 1). No fake form — the app already has a proper
 * multi-step, server-validated booking journey.
 */
export default function BookingCta() {
  return (
    <section
      id="book"
      className="grid-ambient relative overflow-hidden px-6 py-40 text-center sm:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(201,161,94,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <p className="eyebrow mb-10">Reserve your chair</p>

        <AnimatedHeading
          as="h2"
          text="Your next look starts here."
          className="font-display text-5xl leading-[0.95] font-light text-ivory sm:text-7xl lg:text-8xl"
          stagger={0.07}
        />

        <div className="mt-14 flex flex-col items-center gap-6">
          <Magnetic strength={0.55}>
            <Link
              to="/services"
              data-cursor-label="Begin"
              className="group inline-flex items-center gap-4 rounded-full bg-ivory px-10 py-5 text-sm font-semibold tracking-[0.15em] text-ink uppercase"
            >
              Book an appointment
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1.5"
              />
            </Link>
          </Magnetic>

          <p className="text-sm text-ash">{SALON.hoursLabel} · No phone call needed</p>
        </div>
      </div>
    </section>
  );
}
