/**
 * Pure-CSS infinite marquee. Renders the children twice back-to-back and
 * translates the track -50%, so the loop is seamless. Pauses on hover and
 * halts entirely under reduced motion (see .marquee-track in index.css).
 */
export default function Marquee({ children, className = "", separator = "·" }) {
  const content = (
    <span className="flex items-center">
      {children}
      <span aria-hidden="true" className="px-8 text-champagne/60">
        {separator}
      </span>
    </span>
  );

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div className="marquee-track">
        {content}
        {content}
        {content}
        {content}
      </div>
    </div>
  );
}
