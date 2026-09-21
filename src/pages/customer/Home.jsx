import { lazy, Suspense, useRef } from "react";

import Hero from "../../components/sections/Hero.jsx";
import Craft from "../../components/sections/Craft.jsx";
import Services from "../../components/sections/Services.jsx";
import Experience from "../../components/sections/Experience.jsx";
import Ritual from "../../components/sections/Ritual.jsx";
import Gallery from "../../components/sections/Gallery.jsx";
import Testimonials from "../../components/sections/Testimonials.jsx";
import BookingCta from "../../components/sections/BookingCta.jsx";

import { useScissorsScroll } from "../../lib/useScissorsScroll.js";
import { useDeviceTier } from "../../lib/useDeviceTier.js";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

// The 3D canvas is heavy — code-split it so the rest of the page paints first.
const ScissorsScene = lazy(() => import("../../components/3d/ScissorsScene.jsx"));

/**
 * The cinematic landing page. A fixed 3D scissors canvas sits behind the
 * scroll story (HERO → CRAFT → SERVICES → EXPERIENCE); the scissors' pose is
 * driven by that wrapper's scroll progress. After the story, the page
 * continues with Ritual → Gallery → Testimonials → Booking on a solid ink
 * backdrop (the canvas fades out via its own placement behind the content).
 *
 * The 3D scene is skipped entirely on the lowest device tier and under
 * reduced motion — a static gradient stands in, so the hero still sings.
 */
export default function Home() {
  const storyRef = useRef(null);
  const tier = useDeviceTier();
  const reduced = prefersReducedMotion();

  useScissorsScroll(storyRef);

  // Quality: high → full, mid → lighter, low/reduced → no canvas.
  const showCanvas = tier !== "low" && !reduced;
  const quality = tier === "high" ? 2 : 1;

  return (
    <div className="relative">
      {/* Fixed 3D scissors — the signature visual, behind the story */}
      {showCanvas ? (
        <Suspense fallback={null}>
          <ScissorsScene quality={quality} />
        </Suspense>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(90% 70% at 70% 20%, rgba(201,161,94,0.14), transparent 55%), radial-gradient(70% 60% at 20% 80%, rgba(143,163,201,0.10), transparent 60%)",
          }}
        />
      )}

      {/* The scissors story wrapper — its scroll progress drives the 3D pose */}
      <div ref={storyRef} className="relative">
        <Hero />
        <Craft />
        <Services />
        <Experience />
      </div>

      {/* Remaining sections sit on a solid backdrop so the canvas recedes */}
      <div className="relative z-[1] bg-ink">
        <Ritual />
        <Gallery />
        <Testimonials />
        <BookingCta />
      </div>
    </div>
  );
}
