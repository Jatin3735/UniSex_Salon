/**
 * Holds the single active Lenis instance so any component (footer back-to-top,
 * anchor links) can drive the smooth scroll without prop-drilling. Kept in a
 * plain .js module so SmoothScroll.jsx only exports a component (react-refresh).
 */
let lenisInstance = null;

export function setLenis(instance) {
  lenisInstance = instance;
}

export function getLenis() {
  return lenisInstance;
}
