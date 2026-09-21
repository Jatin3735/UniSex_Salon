import { useCallback } from "react";
import {
  Users,
  Scissors,
  UserRound,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
  BadgePercent,
  IndianRupee,
} from "lucide-react";

import { fetchDashboard } from "../../../api/admin.js";
import { useAsync } from "../../../lib/useAsync.js";
import { formatCurrency } from "../../../lib/salon.js";
import { formatDateLabel } from "../../../lib/time.js";
import { SectionLoader, SectionError, Pill } from "../../../components/admin/ui.jsx";

const STATUS_TONE = {
  Pending: "warn",
  Completed: "on",
  Cancelled: "danger",
  "No-show": "info",
};

/** The at-a-glance overview: headline counts, revenue trend, recent activity. */
export default function DashboardSection({ onNavigate }) {
  const load = useCallback((signal) => fetchDashboard({ signal }), []);
  const { data, loading, error, reload } = useAsync(load);

  if (loading) return <SectionLoader label="Loading dashboard…" />;
  if (error) return <SectionError message={error.message} onRetry={reload} />;

  const stats = data?.stats ?? {};
  const statusBreakdown = data?.statusBreakdown ?? {};
  const revenueByDay = data?.revenueByDay ?? [];
  const recentBookings = data?.recentBookings ?? [];

  const cards = [
    { label: "Revenue (paid)", value: formatCurrency(stats.revenue ?? 0), icon: IndianRupee, accent: true },
    { label: "Today's bookings", value: stats.todaysBookings ?? 0, icon: CalendarDays, to: "bookings" },
    { label: "Upcoming", value: stats.upcomingBookings ?? 0, icon: CalendarClock, to: "bookings" },
    { label: "Pending", value: stats.pendingBookings ?? 0, icon: Clock, to: "bookings" },
    { label: "Completed", value: stats.completedBookings ?? 0, icon: CheckCircle2 },
    { label: "Cancelled", value: stats.cancelledBookings ?? 0, icon: XCircle },
    { label: "Customers", value: stats.totalCustomers ?? 0, icon: UserRound, to: "customers" },
    { label: "Staff", value: stats.totalStaff ?? 0, icon: Users, to: "staff" },
    { label: "Services", value: stats.totalServices ?? 0, icon: Scissors, to: "services" },
    { label: "Active offers", value: stats.activeOffers ?? 0, icon: BadgePercent, to: "offers" },
  ];

  const maxRevenue = Math.max(1, ...revenueByDay.map((d) => d.total ?? 0));

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          const clickable = Boolean(c.to && onNavigate);
          return (
            <button
              key={c.label}
              type="button"
              onClick={clickable ? () => onNavigate(c.to) : undefined}
              className={`flex flex-col gap-3 rounded-2xl border p-4 text-left transition ${
                c.accent
                  ? "border-champagne/30 bg-champagne/10"
                  : "border-ivory/10 bg-ink-800"
              } ${clickable ? "hover:border-ivory/25" : "cursor-default"}`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg ${
                  c.accent ? "bg-champagne/20 text-champagne" : "bg-ink-700 text-ivory-dim"
                }`}
              >
                <Icon size={17} />
              </span>
              <span>
                <span className="block font-display text-2xl font-light text-ivory">{c.value}</span>
                <span className="mt-0.5 block text-xs tracking-wide text-ash uppercase">
                  {c.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-light text-ivory">Revenue · last 14 days</h2>
            <span className="text-xs text-ash">Paid bookings</span>
          </div>

          {revenueByDay.length === 0 ? (
            <p className="mt-8 text-sm text-ash">No paid bookings yet.</p>
          ) : (
            <div className="mt-6 flex h-40 items-end gap-1.5">
              {revenueByDay.map((d) => (
                <div key={d.date} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-champagne/40 to-champagne transition group-hover:from-champagne/60"
                      style={{ height: `${Math.max(4, ((d.total ?? 0) / maxRevenue) * 100)}%` }}
                      title={`${formatCurrency(d.total ?? 0)} · ${d.count ?? 0} booking(s)`}
                    />
                  </div>
                  <span className="text-[0.6rem] text-ash">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-5">
          <h2 className="font-display text-lg font-light text-ivory">By status</h2>
          <div className="mt-4 space-y-3">
            {Object.keys(statusBreakdown).length === 0 ? (
              <p className="text-sm text-ash">No bookings yet.</p>
            ) : (
              Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Pill tone={STATUS_TONE[status] ?? "neutral"}>{status}</Pill>
                  <span className="font-medium text-ivory">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="rounded-2xl border border-ivory/10 bg-ink-800 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-light text-ivory">Recent bookings</h2>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("bookings")}
              className="text-xs font-medium text-champagne-soft hover:text-champagne"
            >
              View all →
            </button>
          )}
        </div>

        {recentBookings.length === 0 ? (
          <p className="mt-6 text-sm text-ash">Nothing booked yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-ivory/10 text-left text-xs tracking-wide text-ash uppercase">
                  <th className="pb-2 font-medium">Token</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Stylist</th>
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory/5">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="text-ivory-dim">
                    <td className="py-2.5 font-mono text-xs text-ivory">{b.token}</td>
                    <td className="py-2.5">{b.userName}</td>
                    <td className="py-2.5">{b.staffName}</td>
                    <td className="py-2.5 text-xs">
                      {formatDateLabel(b.date)} · {b.startLabel}
                    </td>
                    <td className="py-2.5 text-right text-ivory">{formatCurrency(b.amount)}</td>
                    <td className="py-2.5 text-right">
                      <Pill tone={STATUS_TONE[b.status] ?? "neutral"}>{b.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
