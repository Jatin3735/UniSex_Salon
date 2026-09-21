import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Scissors,
  BadgePercent,
  Megaphone,
  CalendarDays,
  UserRound,
  Star,
  Images,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  ChevronDown,
} from "lucide-react";

import ToastProvider from "../../components/admin/ToastProvider.jsx";
import { SALON } from "../../lib/salon.js";

import DashboardSection from "./sections/DashboardSection.jsx";
import StaffSection from "./sections/StaffSection.jsx";
import ServicesSection from "./sections/ServicesSection.jsx";
import OffersSection from "./sections/OffersSection.jsx";
import AnnouncementsSection from "./sections/AnnouncementsSection.jsx";
import BookingsSection from "./sections/BookingsSection.jsx";
import CustomersSection from "./sections/CustomersSection.jsx";
import ReviewsSection from "./sections/ReviewsSection.jsx";
import GallerySection from "./sections/GallerySection.jsx";
import SettingsSection from "./sections/SettingsSection.jsx";

/**
 * The full admin dashboard shell. Rendered by AdminGate only after an
 * admin-role credential unlock. Section navigation is internal state (not
 * router paths) so the whole panel stays behind the single secret gate route.
 */

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, Component: DashboardSection },
  { key: "staff", label: "Staff", icon: Users, Component: StaffSection },
  { key: "services", label: "Services", icon: Scissors, Component: ServicesSection },
  { key: "offers", label: "Offers", icon: BadgePercent, Component: OffersSection },
  { key: "announcements", label: "Announcements", icon: Megaphone, Component: AnnouncementsSection },
  { key: "bookings", label: "Bookings", icon: CalendarDays, Component: BookingsSection },
  { key: "customers", label: "Customers", icon: UserRound, Component: CustomersSection },
  { key: "reviews", label: "Reviews", icon: Star, Component: ReviewsSection },
  { key: "gallery", label: "Gallery", icon: Images, Component: GallerySection },
  { key: "settings", label: "Settings", icon: Settings, Component: SettingsSection },
];

export default function AdminApp({ admin, onLock }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const current = useMemo(() => NAV.find((n) => n.key === active) ?? NAV[0], [active]);
  const Section = current.Component;

  // Close the mobile sidebar whenever the section changes.
  useEffect(() => setSidebarOpen(false), [active]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-ink text-ivory">
        {/* ---- Sidebar (desktop) ---- */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ivory/10 bg-ink-900/60 bg-ink-800 lg:flex">
          <SidebarContent active={active} setActive={setActive} onLock={onLock} />
        </aside>

        {/* ---- Sidebar (mobile drawer) ---- */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="relative z-10 flex h-full w-72 flex-col border-r border-ivory/10 bg-ink-800"
              >
                <SidebarContent active={active} setActive={setActive} onLock={onLock} onClose={() => setSidebarOpen(false)} />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Main column ---- */}
        <div className="lg:pl-64">
          {/* Top navigation */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ivory/10 bg-ink-800/80 px-4 backdrop-blur-md sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-ivory-dim transition hover:bg-ink-700 hover:text-ivory lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <h1 className="font-display text-lg font-light text-ivory">{current.label}</h1>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {/* Search — filters the active section's list via the shared query */}
              <div className="relative hidden sm:block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-40 rounded-full border border-ink-600 bg-ink-700 py-2 pl-9 pr-3 text-sm text-ivory placeholder-ash focus:w-56 focus:border-champagne focus:outline-none md:w-56"
                />
              </div>

              <NotificationsBell />

              {/* Profile menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-ivory/10 bg-ink-700 py-1 pl-1 pr-2.5 transition hover:border-ivory/30"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-champagne text-sm font-semibold text-ink">
                    {(admin?.name ?? "A").charAt(0).toUpperCase()}
                  </span>
                  <ChevronDown size={14} className="text-ash" />
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ivory/10 bg-ink-800 shadow-xl"
                      >
                        <div className="border-b border-ivory/10 px-4 py-3">
                          <p className="truncate text-sm font-medium text-ivory">{admin?.name ?? "Administrator"}</p>
                          <p className="truncate text-xs text-ash">{admin?.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            setActive("settings");
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ivory-dim transition hover:bg-ink-700 hover:text-ivory"
                        >
                          <Settings size={15} /> Settings
                        </button>
                        <button
                          type="button"
                          onClick={onLock}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-400/10"
                        >
                          <LogOut size={15} /> Lock panel
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Section content */}
          <main className="grid-ambient min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <Section query={query} onNavigate={setActive} />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ToastProvider>
  );

  function SidebarContent({ active, setActive, onLock, onClose }) {
    return (
      <>
        <div className="flex h-16 items-center justify-between border-b border-ivory/10 px-5">
          <div>
            <p className="eyebrow text-[0.65rem]">Admin</p>
            <p className="font-display text-lg font-light text-ivory">{SALON.name}</p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ash hover:text-ivory lg:hidden" aria-label="Close menu">
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-champagne/15 text-champagne-soft"
                    : "text-ivory-dim hover:bg-ink-700 hover:text-ivory"
                }`}
              >
                <Icon size={18} className={isActive ? "text-champagne" : ""} />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-champagne" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-ivory/10 p-3">
          <button
            type="button"
            onClick={onLock}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-400/10"
          >
            <LogOut size={18} /> Lock panel
          </button>
        </div>
      </>
    );
  }
}

/** A small notifications popover — surfaces today's + pending booking counts. */
function NotificationsBell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-ivory/10 bg-ink-700 p-2 text-ivory-dim transition hover:border-ivory/30 hover:text-ivory"
        aria-label="Notifications"
      >
        <Bell size={17} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-ivory/10 bg-ink-800 p-4 text-sm shadow-xl"
            >
              <p className="font-medium text-ivory">Notifications</p>
              <p className="mt-2 text-xs text-ash">
                Live booking activity appears on the Dashboard. Check the Bookings section for pending
                appointments that need confirming.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
