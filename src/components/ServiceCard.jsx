import { formatCurrency, skillLabel } from "../lib/salon.js";
import { formatDuration } from "../lib/time.js";

/**
 * A selectable service tile.
 *
 * Now a real <button>: it used to be a bare <div> with an onClick, so it was
 * invisible to keyboards and screen readers.
 */
export default function ServiceCard({ service, selected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(service)}
      aria-pressed={selected}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-ink-800 text-left transition
        hover:shadow-lg hover:shadow-black/40 hover:border-champagne/40 focus:ring-2 focus:ring-champagne focus:ring-offset-2 focus:ring-offset-ink focus:outline-none
        ${selected ? "border-champagne ring-2 ring-champagne" : "border-ivory/10"}`}
    >
      <div className="h-52 w-full overflow-hidden bg-ink-700">
        <img
          src={service.image}
          alt={service.title}
          loading="lazy"
          /* h-full was missing, so the image never filled (or cropped to) the box. */
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold text-ivory">{service.title}</h3>
        <p className="mb-3 text-sm text-ash">{service.desc}</p>

        {service.skills?.length > 1 && (
          <p className="mb-3 text-xs text-ash">
            Needs: {service.skills.map(skillLabel).join(" + ")}
          </p>
        )}

        <div className="mt-auto flex justify-between text-sm font-semibold text-ivory">
          <span>{formatCurrency(service.price)}</span>
          <span className="text-ash">{formatDuration(service.duration)}</span>
        </div>

        {selected && (
          <p className="mt-2 text-sm font-semibold text-champagne">&#10003; Selected</p>
        )}
      </div>
    </button>
  );
}
