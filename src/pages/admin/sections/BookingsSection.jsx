import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Pencil } from "lucide-react";

import { fetchBookings, updateBooking, fetchStaff } from "../../../api/admin.js";
import { useAsync } from "../../../lib/useAsync.js";
import { formatCurrency } from "../../../lib/salon.js";
import { formatDateLabel, to12Hour, todayISO, maxDateISO } from "../../../lib/time.js";
import { useToast } from "../../../components/admin/toastContext.js";
import {
  Modal,
  Field,
  Select,
  TextInput,
  PrimaryButton,
  GhostButton,
  SectionLoader,
  SectionError,
  SectionEmpty,
  Pill,
} from "../../../components/admin/ui.jsx";
import { Toolbar, FilterSelect } from "./parts.jsx";

const STATUSES = ["Pending", "Completed", "Cancelled", "No-show"];
const STATUS_TONE = { Pending: "warn", Completed: "on", Cancelled: "danger", "No-show": "info" };

// Bookable start times: 10:00 → 19:45 in 15-min steps (mirrors the server).
const SLOT_OPTIONS = [];
for (let m = 600; m <= 1185; m += 15) SLOT_OPTIONS.push(m);

export default function BookingsSection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [staffId, setStaffId] = useState("");

  const load = useCallback(
    (signal) => fetchBookings({ q: query, status, date, staffId }, { signal }),
    [query, status, date, staffId]
  );
  const { data, loading, error, reload, setData } = useAsync(load);

  const [staffOptions, setStaffOptions] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchStaff().then((s) => alive && setStaffOptions(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ staffId: "", date: "", startMinutes: "" });
  const [saving, setSaving] = useState(false);

  const bookings = data ?? [];

  const changeStatus = async (b, next) => {
    if (next === b.status) return;
    setBusyId(b.id);
    try {
      const updated = await updateBooking(b.id, { status: next });
      setData(bookings.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(`Marked ${next}.`);
    } catch (err) {
      toast.error(err.message || "Could not update the booking.");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ staffId: b.staffId ?? "", date: b.date ?? "", startMinutes: String(b.startMinutes ?? "") });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {};
    if (form.staffId && form.staffId !== editing.staffId) payload.staffId = form.staffId;
    if (form.date && form.date !== editing.date) payload.date = form.date;
    if (form.startMinutes !== "" && Number(form.startMinutes) !== editing.startMinutes) {
      payload.startMinutes = Number(form.startMinutes);
    }
    if (Object.keys(payload).length === 0) {
      setEditing(null);
      setSaving(false);
      return;
    }
    try {
      const updated = await updateBooking(editing.id, payload);
      setData(bookings.map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Booking updated.");
      setEditing(null);
    } catch (err) {
      toast.error(err.message || "Could not reschedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Toolbar>
        <FilterSelect value={status} onChange={setStatus} label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={staffId} onChange={setStaffId} label="Stylist">
          <option value="">All stylists</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </FilterSelect>
        <label className="inline-flex items-center gap-2 text-sm text-ash">
          <span className="hidden sm:inline">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-sm text-ivory focus:border-champagne focus:outline-none"
          />
        </label>
        {date && (
          <button type="button" onClick={() => setDate("")} className="text-xs text-champagne-soft hover:text-champagne">
            Clear date
          </button>
        )}
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading bookings…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : bookings.length === 0 ? (
        <SectionEmpty title="No bookings" message="Bookings will appear here as customers make them." icon={CalendarDays} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ivory/10 bg-ink-800">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-ivory/10 text-left text-xs tracking-wide text-ash uppercase">
                <th className="px-4 py-3 font-medium">Token</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Services</th>
                <th className="px-4 py-3 font-medium">Stylist</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/5">
              {bookings.map((b) => (
                <tr key={b.id} className="text-ivory-dim">
                  <td className="px-4 py-3 font-mono text-xs text-ivory">{b.token}</td>
                  <td className="px-4 py-3">
                    <div className="text-ivory">{b.userName}</div>
                    <div className="text-xs text-ash">{b.userMobile}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{b.services.map((s) => s.title).join(", ")}</td>
                  <td className="px-4 py-3">{b.staffName}</td>
                  <td className="px-4 py-3 text-xs">
                    {formatDateLabel(b.date)}
                    <br />
                    {b.startLabel}–{b.endLabel}
                  </td>
                  <td className="px-4 py-3 text-right text-ivory">
                    {formatCurrency(b.amount)}
                    <div className="text-[0.7rem] text-ash">{b.paymentStatus}</div>
                  </td>
                  <td className="px-4 py-3">
                    {b.status === "Cancelled" ? (
                      <Pill tone="danger">Cancelled</Pill>
                    ) : (
                      <select
                        value={b.status}
                        disabled={busyId === b.id}
                        onChange={(e) => changeStatus(b, e.target.value)}
                        className={`rounded-lg border border-ink-600 bg-ink-700 px-2 py-1 text-xs font-medium text-ivory focus:border-champagne focus:outline-none disabled:opacity-50`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      disabled={b.status === "Cancelled"}
                      className="rounded-md p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory disabled:opacity-30"
                      aria-label="Reschedule"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => (saving ? null : setEditing(null))}
        title="Reschedule / reassign"
        subtitle={editing ? `${editing.token} · ${editing.userName}` : ""}
        footer={
          <div className="flex justify-end gap-3">
            <GhostButton onClick={() => setEditing(null)} disabled={saving}>Cancel</GhostButton>
            <PrimaryButton type="submit" form="booking-form" busy={saving}>Save changes</PrimaryButton>
          </div>
        }
      >
        <form id="booking-form" onSubmit={saveEdit} className="space-y-4">
          <Field label="Stylist" hint="Must be qualified for all booked services.">
            <Select value={form.staffId} onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <TextInput
                type="date"
                min={todayISO()}
                max={maxDateISO()}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field label="Start time">
              <Select value={form.startMinutes} onChange={(e) => setForm((f) => ({ ...f, startMinutes: e.target.value }))}>
                {SLOT_OPTIONS.map((m) => (
                  <option key={m} value={m}>{to12Hour(m)}</option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="text-xs text-ash">
            The server re-checks the target calendar and rejects an overlapping slot.
          </p>
        </form>
      </Modal>
    </div>
  );
}
