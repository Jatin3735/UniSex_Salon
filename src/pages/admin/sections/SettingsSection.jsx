import { ShieldCheck, Clock, MapPin, Phone, Mail, Info } from "lucide-react";

import { SALON } from "../../../lib/salon.js";
import { Pill } from "../../../components/admin/ui.jsx";

/**
 * Settings is informational: the salon's public details (edited in code /
 * lib/salon.js), plus notes on how the panel is secured. There is no
 * server-side settings store, so nothing here is editable — it documents the
 * current configuration rather than pretending to save changes.
 */
export default function SettingsSection({ onNavigate }) {
  const details = [
    { icon: MapPin, label: "Address", value: SALON.address },
    { icon: Phone, label: "Phone", value: SALON.phone },
    { icon: Mail, label: "Email", value: SALON.email },
    { icon: Clock, label: "Hours", value: SALON.hoursLabel },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-6">
        <h2 className="font-display text-lg font-light text-ivory">Salon details</h2>
        <p className="mt-1 text-sm text-ash">
          Shown across the public site and the footer. Update these in{" "}
          <code className="rounded bg-ink-700 px-1.5 py-0.5 text-xs text-champagne-soft">src/lib/salon.js</code>.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {details.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.label} className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-700 text-champagne">
                  <Icon size={16} />
                </span>
                <div>
                  <dt className="text-xs tracking-wide text-ash uppercase">{d.label}</dt>
                  <dd className="mt-0.5 text-sm text-ivory">{d.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-champagne" />
          <h2 className="font-display text-lg font-light text-ivory">Security</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm text-ivory-dim">
          <li className="flex items-center justify-between gap-4">
            <span>Panel served on a secret, unlinked path</span>
            <Pill tone="on">Enabled</Pill>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Credential re-check on every visit</span>
            <Pill tone="on">Enabled</Pill>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Auto-lock after 15 minutes of the session</span>
            <Pill tone="on">Enabled</Pill>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Every admin API call re-checks the admin role server-side</span>
            <Pill tone="on">Enforced</Pill>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-champagne/20 bg-champagne/5 p-6">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-champagne" />
          <div className="text-sm text-ivory-dim">
            <p className="font-medium text-ivory">Managing content</p>
            <p className="mt-1">
              Use{" "}
              <button type="button" onClick={() => onNavigate?.("services")} className="text-champagne-soft underline hover:text-champagne">Services</button>,{" "}
              <button type="button" onClick={() => onNavigate?.("staff")} className="text-champagne-soft underline hover:text-champagne">Staff</button>,{" "}
              <button type="button" onClick={() => onNavigate?.("offers")} className="text-champagne-soft underline hover:text-champagne">Offers</button> and{" "}
              <button type="button" onClick={() => onNavigate?.("gallery")} className="text-champagne-soft underline hover:text-champagne">Gallery</button>{" "}
              to manage what appears on the public site. Changes are live immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
