import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * Masked image reveal with an internal parallax drift. A clip wipe uncovers
 * the frame on scroll-in, while the image itself is over-scaled and eased on
 * the Y axis for depth as the section passes. Reduced motion → static image.
 *
 * `parallax` = px of vertical drift across the viewport pass.
 */
export default function RevealImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  parallax = 60,
  rounded = "rounded-none",
}) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return undefined;
    if (prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      // Wipe reveal
      gsap.fromTo(
        wrap,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: wrap, start: "top 88%", once: true },
        }
      );
      // Parallax drift on the oversized image
      gsap.fromTo(
        img,
        { yPercent: -parallax / 6 },
        {
          yPercent: parallax / 6,
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, wrap);

    return () => ctx.revert();
  }, [parallax]);

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${rounded} ${className}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full scale-110 object-cover ${imgClassName}`}
      />
    </div>
  );
}
