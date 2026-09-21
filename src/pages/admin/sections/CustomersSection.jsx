import { useCallback, useState } from "react";
import { UserRound, Ban, CheckCircle2, Eye } from "lucide-react";

import { fetchCustomers, fetchCustomer, setCustomerStatus } from "../../../api/admin.js";
import { useAsync } from "../../../lib/useAsync.js";
import { formatCurrency } from "../../../lib/salon.js";
import { formatDateLabel } from "../../../lib/time.js";
import { useToast } from "../../../components/admin/toastContext.js";
import {
  Modal,
  ConfirmDialog,
  SectionLoader,
  SectionError,
  SectionEmpty,
  Pill,
} from "../../../components/admin/ui.jsx";
import { Toolbar, FilterSelect } from "./parts.jsx";

export default function CustomersSection({ query = "" }) {
  const toast = useToast();
  const [status, setStatus] = useState("");

  const load = useCallback(
    (signal) => fetchCustomers({ q: query, status }, { signal }),
    [query, status]
  );
  const { data, loading, error, reload, setData } = useAsync(load);

  const [detail, setDetail] = useState(null); // { customer, bookings }
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirm, setConfirm] = useState(null); // customer to toggle
  const [busy, setBusy] = useState(false);

  const customers = data ?? [];

  const openDetail = async (c) => {
    setDetail({ customer: c, bookings: null });
    setDetailLoading(true);
    try {
      const full = await fetchCustomer(c.id);
      setDetail({ customer: { ...c, ...full.customer }, bookings: full.bookings ?? [] });
    } catch (err) {
      toast.error(err.message || "Could not load customer.");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const updated = await setCustomerStatus(confirm.id, !confirm.active);
      setData(customers.map((c) => (c.id === updated.id ? { ...c, active: updated.active } : c)));
      toast.success(updated.active ? "Customer reactivated." : "Customer suspended.");
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || "Could not update status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Toolbar>
        <FilterSelect value={status} onChange={setStatus} label="Status">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </FilterSelect>
      </Toolbar>

      {loading ? (
        <SectionLoader label="Loading customers…" />
      ) : error ? (
        <SectionError message={error.message} onRetry={reload} />
      ) : customers.length === 0 ? (
        <SectionEmpty title="No customers" message="Customer accounts will appear here." icon={UserRound} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ivory/10 bg-ink-800">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-ivory/10 text-left text-xs tracking-wide text-ash uppercase">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 text-center font-medium">Bookings</th>
                <th className="px-4 py-3 text-right font-medium">Spent</th>
                <th className="px-4 py-3 font-medium">Last visit</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory/5">
              {customers.map((c) => (
                <tr key={c.id} className="text-ivory-dim">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-ivory">{c.name}</span>
                      {!c.active && <Pill tone="danger">Suspended</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{c.email}</div>
                    {c.mobile && <div className="text-ash">{c.mobile}</div>}
                  </td>
                  <td className="px-4 py-3 text-center text-ivory">{c.totalBookings ?? 0}</td>
                  <td className="px-4 py-3 text-right text-ivory">{formatCurrency(c.totalSpent ?? 0)}</td>
                  <td className="px-4 py-3 text-xs">
                    {c.lastBookingDate ? formatDateLabel(c.lastBookingDate) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openDetail(c)} className="rounded-md p-1.5 text-ash transition hover:bg-ink-700 hover:text-ivory" aria-label="View">
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirm(c)}
                        className={`rounded-md p-1.5 transition ${c.active ? "text-ash hover:bg-red-400/10 hover:text-red-300" : "text-ash hover:bg-green-400/10 hover:text-green-300"}`}
                        aria-label={c.active ? "Suspend" : "Reactivate"}
                      >
                        {c.active ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer detail */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.customer?.name}
        subtitle={detail?.customer?.email}
        maxWidth="max-w-2xl"
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Mobile" value={detail.customer.mobile || "—"} />
              <Stat label="Joined" value={detail.customer.createdAt ? formatDateLabel(detail.customer.createdAt.slice(0, 10)) : "—"} />
              <Stat label="Status" value={detail.customer.active ? "Active" : "Suspended"} />
              {detail.customer.dob && <Stat label="Birthday" value={detail.customer.dob} />}
            </div>
            {detail.customer.preferences && (
              <div>
                <p className="text-xs tracking-wide text-ash uppercase">Preferences</p>
                <p className="mt-1 text-sm text-ivory-dim">{detail.customer.preferences}</p>
              </div>
            )}

            <div>
              <p className="text-xs tracking-wide text-ash uppercase">Bookings</p>
              {detailLoading ? (
                <p className="mt-2 text-sm text-ash">Loading…</p>
              ) : (detail.bookings ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-ash">No bookings yet.</p>
              ) : (
                <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {detail.bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-ivory/10 bg-ink-700 px-3 py-2 text-sm">
                      <div>
                        <p className="text-ivory">{b.services.map((s) => s.title).join(", ")}</p>
                        <p className="text-xs text-ash">{formatDateLabel(b.date)} · {b.startLabel} · {b.staffName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-ivory">{formatCurrency(b.amount)}</p>
                        <Pill tone={b.status === "Completed" ? "on" : b.status === "Cancelled" ? "danger" : "warn"}>{b.status}</Pill>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={toggleStatus}
        busy={busy}
        tone={confirm?.active ? "danger" : "gold"}
        title={confirm?.active ? "Suspend customer?" : "Reactivate customer?"}
        message={
          confirm?.active
            ? `"${confirm?.name}" will not be able to sign in until reactivated.`
            : `"${confirm?.name}" will be able to sign in again.`
        }
        confirmLabel={confirm?.active ? "Suspend" : "Reactivate"}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-ivory/10 bg-ink-700 px-3 py-2">
      <p className="text-xs tracking-wide text-ash uppercase">{label}</p>
      <p className="mt-0.5 text-sm text-ivory">{value}</p>
    </div>
  );
}
