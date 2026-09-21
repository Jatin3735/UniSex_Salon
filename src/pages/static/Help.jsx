import { useState } from "react";
import { Link } from "react-router-dom";

import { SALON } from "../../lib/salon.js";

const FAQS = [
  {
    q: "How do I book an appointment?",
    a: "Open Services, tap every service you want, then continue. We show only the stylists who can do all of them, then a calendar of free fifteen-minute slots. Pick one, pay, and you get a booking token.",
  },
  {
    q: "Do I need an account?",
    a: "You can browse and choose slots while signed out. We only ask you to log in at the payment step, and your selections are kept while you do — you come straight back to where you left off.",
  },
  {
    q: "Why can't I see a stylist I wanted?",
    a: "We only list stylists qualified for every service in your basket. If you picked Facial and Spa, only someone who does both appears. Remove a service to widen the list.",
  },
  {
    q: "Why are some time slots greyed out?",
    a: "Either they're already booked, they're in the past, or the appointment wouldn't finish before we close at 8pm. A ninety-minute treatment needs ninety free minutes, so the last slot for it is 6:30pm.",
  },
  {
    q: "Can I pay at the salon?",
    a: "Yes — choose Pay at Salon at checkout. Your booking is confirmed and the payment shows as 'Pay at salon' until you settle up with us.",
  },
  {
    q: "How do I cancel?",
    a: "Go to My Bookings and hit Cancel on any upcoming appointment. The slot is released immediately for someone else, and anything you'd paid is marked refunded.",
  },
  {
    q: "How far ahead can I book?",
    a: "Up to fourteen days.",
  },
];

export default function Help() {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-display font-light text-ivory">Help &amp; FAQ</h1>
      <p className="mt-3 text-ash">The questions we get asked most.</p>

      <div className="mt-8 divide-y divide-ivory/10 overflow-hidden rounded-2xl border border-ivory/10 bg-ink-800">
        {FAQS.map((faq, i) => {
          const expanded = open === i;
          return (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? -1 : i)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-ink-700"
              >
                <span className="font-semibold text-ivory">{faq.q}</span>
                <span className="shrink-0 text-xl text-ash" aria-hidden="true">
                  {expanded ? "\u2212" : "+"}
                </span>
              </button>
              {expanded && <p className="px-6 pb-5 text-sm text-ivory-dim">{faq.a}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-ivory/10 bg-ink-800 p-6 text-center">
        <p className="text-ivory-dim">Still stuck?</p>
        <p className="mt-2 text-sm text-ash">
          Call{" "}
          <a
            href={`tel:${SALON.phone.replace(/\s/g, "")}`}
            className="font-semibold text-ivory hover:text-champagne"
          >
            {SALON.phone}
          </a>{" "}
          or{" "}
          <Link to="/contact" className="font-semibold text-ivory hover:text-champagne">
            send us a message
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
