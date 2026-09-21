import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Camera, AtSign, Send } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Marquee from "./cinematic/Marquee.jsx";
import Magnetic from "./cinematic/Magnetic.jsx";
import { SALON } from "../lib/salon.js";
import { currentYear } from "../lib/time.js";
import { getLenis } from "../lib/lenisInstance.js";
import { prefersReducedMotion } from "../lib/useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

const LINKS = [
  { label: "Services", to: "/services" },
  { label: "Our Team", to: "/staff" },
  { label: "My Bookings", to: "/my-bookings" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Help", to: "/help" },
];

const SOCIALS = [
  { label: "Instagram", icon: Camera, href: "#" },
  { label: "Facebook", icon: AtSign, href: "#" },
  { label: "Twitter / X", icon: Send, href: "#" },
];

/**
 * Cinematic global footer. Giant background wordmark, an animated marquee
 * strapline, an ambient grid, magnetic links and a magnetic back-to-top.
 * The content lifts in on scroll (a reveal, not a fragile fixed-clip, so it
 * behaves on every route — including the booking pages that share this shell).
 */
export default function Footer() {
  const rootRef = useRef(null);

  useEffect(() => {
    // Reduced motion: elements are already in their natural (visible) state
    // because we never apply the gsap.from() offsets.
    if (prefersReducedMotion()) return undefined;
    const el = rootRef.current;
    if (!el) return undefined;

    const ctx = gsap.context(() => {
      gsap.from("[data-foot-rise]", {
        yPercent: 40,
        autoAlpha: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
      gsap.from("[data-foot-word]", {
        yPercent: 60,
        autoAlpha: 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <footer
      ref={rootRef}
      className="grid-ambient relative mt-auto overflow-hidden bg-ink text-ivory-dim"
    >
      {/* Marquee strapline */}
      <div className="border-y border-ivory/10 py-6">
        <Marquee className="text-sm tracking-[0.35em] text-ivory/70 uppercase">
          <span className="px-8">Craft your signature</span>
          <span className="px-8">Precision grooming</span>
          <span className="px-8">Book your chair</span>
          <span className="px-8">{SALON.name}</span>
        </Marquee>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-10 sm:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div data-foot-rise>
            <p className="eyebrow mb-6">The house</p>
            <p className="max-w-xs font-display text-2xl leading-snug font-light text-ivory">
              {SALON.tagline}
            </p>
            <p className="mt-6 text-sm text-ash">{SALON.hoursLabel}</p>

            <div className="mt-8 flex gap-4">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <Magnetic key={label} strength={0.5}>
                  <a
                    href={href}
                    aria-label={label}
                    data-cursor
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-champagne hover:text-champagne"
                  >
                    <Icon size={17} />
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>

          <nav data-foot-rise aria-label="Footer">
            <p className="eyebrow mb-6">Explore</p>
            <ul className="space-y-3 text-sm">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    data-cursor
                    className="inline-block transition-colors hover:text-champagne"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div data-foot-rise>
            <p className="eyebrow mb-6">Visit</p>
            <address className="space-y-3 text-sm not-italic">
              <p className="text-ivory/80">
                <a
                  href={SALON.mapLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-champagne"
                >
                  {SALON.address}
                </a>
              </p>
              <p>
                <a href={`tel:${SALON.phone.replace(/\s/g, "")}`} className="hover:text-champagne">
                  {SALON.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${SALON.email}`} className="hover:text-champagne">
                  {SALON.email}
                </a>
              </p>
            </address>

            <Magnetic strength={0.4}>
              <button
                type="button"
                onClick={toTop}
                data-cursor-label="Top"
                className="group mt-10 inline-flex items-center gap-3 text-xs tracking-[0.2em] text-ivory uppercase"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 transition-colors group-hover:border-champagne group-hover:text-champagne">
                  <ArrowUp size={16} />
                </span>
                Back to top
              </button>
            </Magnetic>
          </div>
        </div>

        {/* Giant background wordmark */}
        <div className="pointer-events-none mt-16 overflow-hidden">
          <p
            data-foot-word
            className="font-display text-[22vw] leading-[0.8] font-light tracking-tight text-ivory/[0.05] select-none"
          >
            {SALON.name}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-6 text-xs text-ash sm:flex-row">
          <p>
            &copy; {currentYear()} {SALON.name}. Crafted in Bengaluru.
          </p>
          <p className="tracking-[0.2em] uppercase">Craft your signature</p>
        </div>
      </div>
    </footer>
  );
}
