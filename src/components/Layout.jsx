import { Outlet, useLocation } from "react-router-dom";

import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import Cursor from "./cinematic/Cursor.jsx";

/**
 * One navbar, footer and custom cursor for the whole app.
 *
 * The navbar is fixed/overlaid. On the home page the hero owns the top
 * spacing and the nav floats transparent; every other page gets top padding
 * so its content clears the fixed pill.
 */
export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Cursor />
      <Navbar />
      <main className={`flex-1 ${isHome ? "" : "pt-24"}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
