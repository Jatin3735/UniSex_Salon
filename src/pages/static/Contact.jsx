import { useState } from "react";

import { SALON } from "../../lib/salon.js";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Honest about what this does: there is no mail service wired up.
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-display font-light text-ivory">Contact us</h1>
      <p className="mt-3 text-ash">
        Questions about a booking, or want something we don&apos;t list? Reach out.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-ivory/10 bg-ink-800">
            <div className="p-6">
              <p className="text-sm font-semibold tracking-wide text-ash uppercase">Visit</p>
              <p className="mt-2 text-ivory">{SALON.address}</p>
              <p className="mt-1 text-sm text-ash">{SALON.hoursLabel}</p>
              <a
                href={SALON.mapLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-champagne underline hover:text-champagne-soft"
              >
                Open in Google Maps
              </a>
            </div>
            <iframe
              title={`Map to ${SALON.name}`}
              src={SALON.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-64 w-full border-0"
            />
          </div>

          <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-6">
            <p className="text-sm font-semibold tracking-wide text-ash uppercase">Call</p>
            <a
              href={`tel:${SALON.phone.replace(/\s/g, "")}`}
              className="mt-2 block text-lg font-semibold text-ivory hover:text-champagne"
            >
              {SALON.phone}
            </a>
          </div>

          <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-6">
            <p className="text-sm font-semibold tracking-wide text-ash uppercase">Email</p>
            <a
              href={`mailto:${SALON.email}`}
              className="mt-2 block text-lg font-semibold text-ivory hover:text-champagne"
            >
              {SALON.email}
            </a>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-ivory/10 bg-ink-800 p-6"
        >
          {sent && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Thanks {form.name || "there"} — this demo doesn&apos;t send mail, so please call or
              email us directly and we&apos;ll get straight back to you.
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-ivory-dim">Your name</span>
            <input
              required
              value={form.name}
              onChange={set("name")}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-ivory placeholder-ash focus:border-champagne focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ivory-dim">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={set("email")}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-ivory placeholder-ash focus:border-champagne focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ivory-dim">Message</span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={set("message")}
              className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-700 px-4 py-2 text-ivory placeholder-ash focus:border-champagne focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-champagne px-6 py-3 font-semibold text-ink transition hover:bg-champagne-soft"
          >
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
