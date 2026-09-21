import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * Reveals a heading word-by-word from a clipped baseline as it scrolls into
 * view — the editorial "type rises through a mask" effect, done without the
 * paid SplitText plugin. Pass the text as a string; markup is generated so
 * each word sits in its own overflow-hidden line box.
 *
 * `as` picks the tag (h1/h2/p…). Reduced motion → plain static text.
 */
export default function AnimatedHeading({
  text,
  as: Tag = "h2",
  className = "",
  wordClassName = "",
  delay = 0,
  stagger = 0.06,
  start = "top 85%",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    const words = el.querySelectorAll("[data-word]");
    const ctx = gsap.context(() => {
      gsap.set(words, { yPercent: 115 });
      gsap.to(words, {
        yPercent: 0,
        duration: 1,
        ease: "expo.out",
        stagger,
        delay,
        scrollTrigger: { trigger: el, start, once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [delay, stagger, start]);

  const words = String(text).split(" ");

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="line-mask inline-block align-bottom">
          <span data-word className={`inline-block ${wordClassName}`}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}
