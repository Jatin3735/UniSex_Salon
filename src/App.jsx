import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthProvider from "./context/AuthProvider.jsx";
import BookingProvider from "./context/BookingProvider.jsx";
import SmoothScroll from "./lib/SmoothScroll.jsx";

import Home from "./pages/customer/Home.jsx";
import Services from "./pages/customer/Services.jsx";
import Staff from "./pages/customer/Staff.jsx";
import StaffSelect from "./pages/customer/StaffSelect.jsx";
import SlotSelect from "./pages/customer/SlotSelect.jsx";
import Login from "./pages/customer/Login.jsx";
import Signup from "./pages/customer/Signup.jsx";
import Payment from "./pages/customer/Payment.jsx";
import Token from "./pages/customer/Token.jsx";
import MyBookings from "./pages/customer/MyBookings.jsx";
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import AdminGate from "./pages/admin/AdminGate.jsx";

import About from "./pages/static/About.jsx";
import Contact from "./pages/static/Contact.jsx";
import Help from "./pages/static/Help.jsx";
import Forbidden from "./pages/static/Forbidden.jsx";
import NotFound from "./pages/static/NotFound.jsx";

/**
 * Providers wrap the router so every page can read auth and the in-progress
 * booking. The original App had eight routes and never imported Token or
 * either dashboard — completing a booking hit a route that didn't exist.
 */
// The admin panel is served only at this secret, env-configured path — never
// linked from the UI. Falls back to a random-looking default if the env var is
// unset so the panel is never accidentally exposed at a guessable route.
const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH || "sx-console-x7k9q2").replace(/^\/+/, "");

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <SmoothScroll>
          <Routes>
            <Route element={<Layout />}>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/select-staff" element={<StaffSelect />} />
              <Route path="/select-slot" element={<SlotSelect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              {/* Navbar used to link here; it had no route and 404'd. */}
              <Route path="/contact_us" element={<Navigate to="/contact" replace />} />
              <Route path="/help" element={<Help />} />
              <Route path="/forbidden" element={<Forbidden />} />

              {/* Any signed-in user */}
              <Route element={<ProtectedRoute />}>
                <Route path="/payment" element={<Payment />} />
                <Route path="/token/:token" element={<Token />} />
                <Route path="/my-bookings" element={<MyBookings />} />
              </Route>

              {/* Staff only */}
              <Route element={<ProtectedRoute roles={["staff"]} />}>
                <Route path="/dashboard" element={<StaffDashboard />} />
              </Route>

              {/* Admin panel — secret path, no link anywhere, its own login
                  gate. /admin is deliberately NOT a route, so it 404s like any
                  other unknown URL. */}
              <Route path={`/${ADMIN_PATH}`} element={<AdminGate />} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </SmoothScroll>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
