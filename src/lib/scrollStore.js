/**
 * A tiny mutable store bridging GSAP ScrollTrigger → the R3F render loop.
 *
 * ScrollTrigger writes `progress` (0..1 across the 3D story) on scroll; the
 * scene reads it inside useFrame. Keeping this outside React means scrolling
 * never triggers a React re-render — the canvas just interpolates.
 */
export const scrollStore = {
  progress: 0, // 0..1 over the whole scissors story
  velocity: 0, // signed scroll velocity (for spin flourish)
  pointerX: 0, // -1..1 normalized pointer, for subtle parallax
  pointerY: 0,
};

export function setScrollProgress(p, velocity = 0) {
  scrollStore.progress = p;
  scrollStore.velocity = velocity;
}

export function setPointer(x, y) {
  scrollStore.pointerX = x;
  scrollStore.pointerY = y;
}
