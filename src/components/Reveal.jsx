import { useEffect, useRef, useState } from "react";

/**
 * Fades + slides its children in the first time they scroll into view.
 *
 * The state change happens inside the IntersectionObserver callback (not
 * synchronously in the effect body), so it doesn't trip
 * react-hooks/set-state-in-effect. Falls back to visible if the browser has
 * no IntersectionObserver.
 */
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  // Start visible when there's no observer to reveal us (SSR/old browsers),
  // so we never set state synchronously inside the effect.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
