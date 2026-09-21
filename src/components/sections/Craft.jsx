import AnimatedHeading from "../cinematic/AnimatedHeading.jsx";
import RevealImage from "../cinematic/RevealImage.jsx";
import Reveal from "../Reveal.jsx";

/**
 * SECTION 2 — THE CRAFT. Editorial two-column composition: a statement of
 * philosophy in oversized display type beside a masked, parallaxing image.
 * The scissors travel across this section (driven by the fixed canvas).
 */
export default function Craft() {
  return (
    <section id="craft" className="relative px-6 py-32 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-8">01 — The craft</p>

          <AnimatedHeading
            as="h2"
            text="A haircut is not a service. It is a signature."
            className="font-display text-4xl leading-[1.05] font-light text-ivory sm:text-5xl lg:text-6xl"
          />

          <Reveal className="mt-8 max-w-lg text-lg leading-relaxed text-ivory-dim">
            Every chair begins with a conversation — your face, your hair, the
            life you live in it. Then the work: measured, unhurried, exact. We
            treat the scissors as an extension of the hand, and the mirror as a
            promise.
          </Reveal>

          <Reveal delay={120} className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
            {[
              { k: "Master", v: "stylists only" },
              { k: "15-min", v: "slot precision" },
              { k: "Zero", v: "double-booking" },
            ].map((item) => (
              <div key={item.k}>
                <p className="font-display text-3xl text-metal">{item.k}</p>
                <p className="mt-1 text-xs tracking-[0.2em] text-ash uppercase">{item.v}</p>
              </div>
            ))}
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <RevealImage
            src="/haircut.jpg"
            alt="A stylist shaping a precision cut"
            className="aspect-[4/5] w-full"
            parallax={80}
          />
          <p className="mt-4 text-xs tracking-[0.2em] text-ash uppercase">
            Precision, in practice
          </p>
        </div>
      </div>
    </section>
  );
}
