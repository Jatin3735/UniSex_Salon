import { useCallback, useMemo, useState } from "react";

import { BookingContext } from "./bookingContext.js";
import { readJSON, removeKey, writeJSON } from "../lib/safeStorage.js";

const DRAFT_KEY = "salonx.draft";

const EMPTY = {
  services: [], // full service objects, so summaries render without a refetch
  staff: null,
  date: null,
  startMinutes: null,
};

/**
 * The in-progress booking.
 *
 * Previously this lived only in `location.state`, so navigating to /login
 * mid-flow threw away the services, staff and slot the customer had picked —
 * they landed on Payment's "Invalid booking data" screen. Persisting the
 * draft is what makes the login redirect (and a mid-flow refresh) survive.
 */
export default function BookingProvider({ children }) {
  const [draft, setDraft] = useState(() => {
    const stored = readJSON(DRAFT_KEY, null);
    if (!stored || typeof stored !== "object") return EMPTY;
    return {
      services: Array.isArray(stored.services) ? stored.services : [],
      staff: stored.staff ?? null,
      date: stored.date ?? null,
      startMinutes: typeof stored.startMinutes === "number" ? stored.startMinutes : null,
    };
  });

  const update = useCallback((next) => {
    setDraft((prev) => {
      const merged = typeof next === "function" ? next(prev) : { ...prev, ...next };
      writeJSON(DRAFT_KEY, merged);
      return merged;
    });
  }, []);

  const toggleService = useCallback(
    (service) => {
      update((prev) => {
        const isSelected = prev.services.some((s) => s.id === service.id);
        const services = isSelected
          ? prev.services.filter((s) => s.id !== service.id)
          : [...prev.services, service];

        // Changing the service list can invalidate the chosen staff member
        // (they may not have every required skill) and therefore the slot.
        return { ...prev, services, staff: null, startMinutes: null };
      });
    },
    [update]
  );

  const setStaff = useCallback(
    (staff) => {
      // A different staff member has a different calendar, so drop the slot.
      update((prev) => ({ ...prev, staff, startMinutes: null }));
    },
    [update]
  );

  const setDate = useCallback(
    (date) => update((prev) => ({ ...prev, date, startMinutes: null })),
    [update]
  );

  const setSlot = useCallback(
    (startMinutes) => update((prev) => ({ ...prev, startMinutes })),
    [update]
  );

  const clearDraft = useCallback(() => {
    removeKey(DRAFT_KEY);
    setDraft(EMPTY);
  }, []);

  const value = useMemo(() => {
    const { services, staff, date, startMinutes } = draft;
    return {
      draft,
      services,
      staff,
      date,
      startMinutes,
      serviceIds: services.map((s) => s.id),
      totalPrice: services.reduce((sum, s) => sum + (s.price ?? 0), 0),
      totalDuration: services.reduce((sum, s) => sum + (s.duration ?? 0), 0),
      hasServices: services.length > 0,
      hasStaff: Boolean(staff),
      hasSlot: typeof startMinutes === "number" && Boolean(date),
      isSelected: (id) => services.some((s) => s.id === id),
      toggleService,
      setStaff,
      setDate,
      setSlot,
      clearDraft,
    };
  }, [draft, toggleService, setStaff, setDate, setSlot, clearDraft]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
