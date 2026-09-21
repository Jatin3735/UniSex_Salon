import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Scissors } from "lucide-react";

import Magnetic from "./cinematic/Magnetic.jsx";
import { useAuth } from "../context/authContext.js";
import { SALON } from "../lib/salon.js";
import { useReducedMotion } from "../lib/useReducedMotion.js";

const MENU = [
  { name: "Services", to: "/services" },
  { name: "Experience", to: "/#experience" },
  { name: "Gallery", to: "/#gallery" },
  { name: "Our Team", to: "/staff" },
  { name: "About", to: "/about" },
  { name: "Contact", to: "/contact" },
];

/**
 * The dashboard each role lands on from the navbar.
 *
 * Admins are deliberately absent: the admin panel leaves no trace in the
 * public UI and is reached only via its secret path. An admin who signs in
 * through the normal form simply sees no dashboard link here.
 */
function homeFor(role) {
  if (role === "staff") return { label: "My Schedule", to: "/dashboard" };
  return { label: "My Bookings", to: "/my-bookings" };
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();

  // Transparent over the hero, glass once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The home hero is the only place we float transparent. Everywhere else the
  // content is not a full-bleed dark hero, so the glass pill reads immediately.
  const onHome = location.pathname === "/";
  const solid = scrolled || !onHome;

  // Close the drawer on navigation (adjust-state-during-render pattern).
  const [lastPath, setLastPath] = useState(location.pathname + location.hash);
  if (location.pathname + location.hash !== lastPath) {
    setLastPath(location.pathname + location.hash);
    if (open) setOpen(false);
  }

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const dash = user ? homeFor(user.role) : null;

  const linkClass = ({ isActive }) =>
    `relative text-sm tracking-wide transition-colors duration-300 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-champagne after:transition-all after:duration-300 ${
      isActive
        ? "text-ivory after:w-full"
        : "text-ivory/70 hover:text-ivory after:w-0 hover:after:w-full"
    }`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid ? "py-3" : "py-5"
        }`}
      >
        <nav
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-3 transition-all duration-500 sm:px-6 ${
            solid ? "glass mx-4 shadow-2xl shadow-black/30 lg:mx-auto" : "mx-4 lg:mx-auto"
          }`}
        >
          <Link
            to="/"
            aria-label={`${SALON.name} — home`}
            className="group flex items-center gap-2.5 text-lg font-semibold tracking-wide text-ivory"
          >
            <Scissors
              size={20}
              className="text-champagne transition-transform duration-500 group-hover:rotate-90"
            />
            <span className="font-display text-xl tracking-tight">
              {SALON.name.split(" ").map((word, i) => (
                <span key={word} className={i === 0 ? "text-ivory" : "text-metal ml-1.5"}>
                  {word}
                </span>
              ))}
            </span>
          </Link>

          {/* DESKTOP */}
          <div className="hidden items-center gap-8 lg:flex">
            {MENU.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                end={item.to === "/"}
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="text-sm tracking-wide text-ivory/70 transition-colors hover:text-ivory"
                >
                  Login
                </Link>
                <Magnetic strength={0.5}>
                  <Link
                    to="/services"
                    data-cursor-label="Book"
                    className="rounded-full bg-ivory px-6 py-2.5 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-white"
                  >
                    Book Now
                  </Link>
                </Magnetic>
              </>
            ) : (
              <>
                <NavLink to={dash.to} className={linkClass}>
                  {dash.label}
                </NavLink>
                <span className="text-sm text-ash">Hi, {user.name.split(" ")[0]}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-ivory/20 px-5 py-2 text-sm text-ivory/80 transition-colors hover:border-ivory/60 hover:text-ivory"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="text-ivory lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-ink/98 px-8 pt-28 pb-10 backdrop-blur-xl lg:hidden"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="flex flex-1 flex-col gap-2">
              {MENU.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={reduced ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.1, duration: 0.4 }}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className="block border-b border-ivory/10 py-4 font-display text-3xl font-light text-ivory"
                  >
                    {item.name}
                  </NavLink>
                </motion.div>
              ))}
              {user && (
                <NavLink
                  to={dash.to}
                  className="block border-b border-ivory/10 py-4 font-display text-3xl font-light text-ivory"
                >
                  {dash.label}
                </NavLink>
              )}
            </nav>

            <div className="flex flex-col gap-4">
              {!user ? (
                <>
                  <Link
                    to="/services"
                    className="rounded-full bg-ivory py-4 text-center text-sm font-semibold tracking-wide text-ink uppercase"
                  >
                    Book Now
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-full border border-ivory/25 py-4 text-center text-sm tracking-wide text-ivory uppercase"
                  >
                    Login
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-ivory/25 py-4 text-center text-sm tracking-wide text-ivory uppercase"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
