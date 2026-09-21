import { skillLabel } from "../lib/salon.js";

/**
 * A staff member, optionally selectable.
 *
 * `onSelect` is optional on purpose: /staff renders these as a read-only
 * roster and passed no handler, which made every click throw
 * "onSelect is not a function".
 */
export default function StaffCard({ staff, selected = false, onSelect }) {
  const skills = Array.isArray(staff?.skills) ? staff.skills : [];
  const selectable = typeof onSelect === "function";

  const body = (
    <>
      <img
        src={staff.photo}
        alt={staff.name}
        loading="lazy"
        className="mx-auto h-28 w-28 rounded-full bg-ink-700 object-cover md:mx-0"
      />

      <div className="mt-4 text-center md:mt-0 md:ml-4 md:text-left">
        <h3 className="text-lg font-bold text-ivory">{staff.name}</h3>
        {staff.age ? <p className="text-sm text-ash">Age: {staff.age}</p> : null}
        {staff.mobile ? <p className="text-sm text-ash">&#128222; {staff.mobile}</p> : null}

        <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
          {skills.length === 0 ? (
            <span className="text-xs text-ash">No services listed</span>
          ) : (
            skills.map((skill) => (
              <span key={skill} className="rounded-full bg-ink-700 px-3 py-1 text-xs text-ivory-dim">
                {skillLabel(skill)}
              </span>
            ))
          )}
        </div>

        {selected && <p className="mt-2 text-sm font-semibold text-champagne">&#10003; Selected</p>}
      </div>
    </>
  );

  const shell = `flex flex-col rounded-2xl border bg-ink-800 p-4 md:flex-row ${
    selected ? "border-champagne ring-2 ring-champagne" : "border-ivory/10"
  }`;

  if (!selectable) return <div className={shell}>{body}</div>;

  return (
    <button
      type="button"
      onClick={() => onSelect(staff)}
      aria-pressed={selected}
      className={`${shell} w-full text-left transition hover:shadow-lg hover:shadow-black/40 hover:border-champagne/40 focus:ring-2 focus:ring-champagne focus:ring-offset-2 focus:ring-offset-ink focus:outline-none`}
    >
      {body}
    </button>
  );
}
