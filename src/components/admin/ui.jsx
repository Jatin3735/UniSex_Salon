import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Inbox, AlertTriangle } from "lucide-react";

/* ------------------------------------------------------------------ *
 * Shared admin UI primitives — all matched to the ink/ivory/champagne
 * design system. Dark luxury surfaces, glass, champagne accents.
 * ------------------------------------------------------------------ */

/** Locks body scroll while an overlay is open. */
function useBodyLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Closes an overlay on Escape. */
function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

/**
 * Centered modal dialog. Used for compact forms and detail views.
 */
export function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = "max-w-lg" }) {
  useBodyLock(open);
  useEscape(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={`relative z-10 flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-ivory/10 bg-ink-800 shadow-2xl`}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 border-b border-ivory/10 px-6 py-4">
                <div>
                  {title && <h2 className="font-display text-xl font-light text-ivory">{title}</h2>}
                  {subtitle && <p className="mt-0.5 text-sm text-ash">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-ivory/10 px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Right-side drawer. Used for the larger create/edit forms on mobile + desktop.
 */
export function Drawer({ open, onClose, title, subtitle, children, footer }) {
  useBodyLock(open);
  useEscape(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-ivory/10 bg-ink-800 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-ivory/10 px-6 py-4">
              <div>
                {title && <h2 className="font-display text-xl font-light text-ivory">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-sm text-ash">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-ivory/10 px-6 py-4">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Confirmation dialog for destructive / irreversible actions.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", tone = "danger", busy = false }) {
  const confirmClasses =
    tone === "danger"
      ? "bg-red-500 text-white hover:bg-red-400"
      : "bg-champagne text-ink hover:bg-champagne-soft";

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm leading-relaxed text-ivory-dim">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg border border-ivory/20 px-5 py-2 text-sm text-ivory/80 transition hover:border-ivory/50 hover:text-ivory disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition disabled:opacity-60 ${confirmClasses}`}
        >
          {busy && <Loader2 size={15} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---- Form fields --------------------------------------------------------- */

const inputBase =
  "mt-1 w-full rounded-lg border bg-ink-700 px-4 py-2 text-ivory placeholder-ash transition focus:outline-none";

export function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      {label && <span className="text-sm font-medium text-ivory-dim">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ash">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function TextInput({ error, className = "", ...props }) {
  return (
    <input
      {...props}
      className={`${inputBase} ${error ? "border-red-400/60" : "border-ink-600 focus:border-champagne"} ${className}`}
    />
  );
}

export function TextArea({ error, className = "", rows = 3, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={`${inputBase} resize-none ${error ? "border-red-400/60" : "border-ink-600 focus:border-champagne"} ${className}`}
    />
  );
}

export function Select({ error, className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`${inputBase} ${error ? "border-red-400/60" : "border-ink-600 focus:border-champagne"} ${className}`}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-champagne" : "bg-ink-600"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
      {label && <span className="text-sm text-ivory-dim">{label}</span>}
    </button>
  );
}

/* ---- Buttons ------------------------------------------------------------- */

export function PrimaryButton({ busy = false, children, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-champagne px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-champagne-soft disabled:cursor-not-allowed disabled:bg-ink-600 disabled:text-ash ${className}`}
    >
      {busy && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-ivory/20 px-4 py-2 text-sm text-ivory/80 transition hover:border-ivory/50 hover:text-ivory disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ---- Section state blocks ------------------------------------------------ */

export function SectionLoader({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ash">
      <Loader2 size={26} className="animate-spin text-champagne" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function SectionError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/5 py-16 text-center">
      <AlertTriangle size={26} className="text-red-400" />
      <p className="max-w-sm text-sm text-red-200">{message || "Something went wrong."}</p>
      {onRetry && (
        <GhostButton onClick={onRetry} className="mt-1">
          Try again
        </GhostButton>
      )}
    </div>
  );
}

export function SectionEmpty({ title = "Nothing here yet", message, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ivory/15 py-16 text-center">
      <Icon size={28} className="text-ash" />
      <div>
        <p className="font-display text-lg font-light text-ivory">{title}</p>
        {message && <p className="mt-1 text-sm text-ash">{message}</p>}
      </div>
      {action}
    </div>
  );
}

/** Pill badge for on/off, featured, statuses within the admin panel. */
export function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-ivory/15 bg-ink-700 text-ivory-dim",
    on: "border-green-400/30 bg-green-400/10 text-green-300",
    off: "border-ash/30 bg-ink-700 text-ash",
    gold: "border-champagne/40 bg-champagne/10 text-champagne-soft",
    danger: "border-red-400/30 bg-red-400/10 text-red-300",
    warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    info: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone] ?? tones.neutral}`}>
      {children}
    </span>
  );
}
