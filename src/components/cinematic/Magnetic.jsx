import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

import { useReducedMotion } from "../../lib/useReducedMotion.js";

/**
 * Wraps children in a magnetic hover field: the element eases toward the
 * pointer while hovered and springs back on leave. Respects reduced motion
 * (renders a plain wrapper). Works around any child — buttons, links, icons.
 *
 * `strength` scales the pull (px of travel at the edge of the element).
 */
export default function Magnetic({ children, strength = 0.4, className = "", as = "div" }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 160, damping: 15, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 160, damping: 15, mass: 0.3 });

  const MotionTag = motion[as] ?? motion.div;

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: "inline-block" }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      {children}
    </MotionTag>
  );
}
