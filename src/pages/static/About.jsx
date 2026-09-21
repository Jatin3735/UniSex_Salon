import { Link } from "react-router-dom";

import { SALON } from "../../lib/salon.js";

const STATS = [
  { value: "7", label: "Services" },
  { value: "3", label: "Stylists" },
  { value: "10a–8p", label: "Open daily" },
  { value: "15 min", label: "Slot precision" },
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-display font-light text-ivory">About {SALON.name}</h1>
      <p className="mt-3 text-lg text-ash">{SALON.tagline}</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-ivory/10 bg-ink-800 p-5 text-center"
          >
            <p className="text-2xl font-bold text-ivory">{stat.value}</p>
            <p className="mt-1 text-xs tracking-wide text-ash uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-4 text-ivory-dim">
        <p>
          {SALON.name} is a neighbourhood salon in Bengaluru. We kept one thing in mind when we
          built this site: you should be able to see exactly who is free and when, and book it
          without a phone call.
        </p>
        <p>
          Pick your services, pick the stylist who does all of them, and pick a real fifteen-minute
          slot on a real calendar. A ninety-minute spa treatment blocks the full ninety minutes, so
          nobody arrives to find their stylist mid-appointment with someone else.
        </p>
        <p>
          Pay online with UPI or card, or choose{" "}
          <span className="font-semibold">Pay at Salon</span> and settle up at the chair.
        </p>
      </div>

      <div className="mt-10 rounded-2xl bg-ink border border-ivory/10 p-8 text-center">
        <p className="text-lg font-semibold text-ivory">Ready when you are.</p>
        <Link
          to="/services"
          className="mt-4 inline-block rounded-lg bg-champagne px-6 py-3 font-semibold text-ink transition hover:bg-champagne-soft"
        >
          Book an appointment
        </Link>
      </div>
    </div>
  );
}
