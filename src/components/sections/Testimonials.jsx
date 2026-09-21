import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useReducedMotion } from "../../lib/useReducedMotion.js";

/**
 * SECTION 7 — TESTIMONIALS. A single large quote that cross-fades between
 * voices, with a quiet author line. No invented statistics or business
 * claims — just placeholder client sentiment. Auto-advances (paused under
 * reduced motion) and is keyboard-navigable via the dots.
 */
const QUOTES = [
  {
    quote:
      "I stopped rehearsing what to ask for. They read what suits me before I sat down.",
    author: "Ananya R.",
    role: "Colour & cut",
  },
  {
    quote:
      "The booking is the calmest part of my week. Pick a time, get a token, done.",
    author: "Vikram S.",
    role: "Signature cut & beard",
  },
  {
    quote:
      "It feels less like an appointment and more like an hour that belongs to me.",
    author: "Meera D.",
    role: "Spa & treatment",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const timer = useRef(null);

  useEffect(() => {
    if (reduced) return undefined;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(timer.current);
  }, [reduced]);

  const go = (i) => {
    setIndex(i);
    if (timer.current) clearInterval(timer.current);
  };

  const active = QUOTES[index];

  return (
    <section id="testimonials" className="relative px-6 py-32 sm:px-10">
      <div className="mx-auto max-w-4xl text-center">
        <p className="eyebrow mb-12">06 — In their words</p>

        <div className="relative min-h-[220px] sm:min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-display text-2xl leading-[1.3] font-light text-ivory sm:text-4xl">
                <span className="text-metal">“</span>
                {active.quote}
                <span className="text-metal">”</span>
              </p>
              <footer className="mt-8">
                <p className="text-sm font-medium tracking-wide text-ivory">{active.author}</p>
                <p className="mt-1 text-xs tracking-[0.2em] text-ash uppercase">{active.role}</p>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex justify-center gap-3" role="tablist" aria-label="Testimonials">
          {QUOTES.map((q, i) => (
            <button
              key={q.author}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show testimonial from ${q.author}`}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-champagne" : "w-2 bg-ivory/25 hover:bg-ivory/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
