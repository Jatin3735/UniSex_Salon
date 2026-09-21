# SalonX

A full-stack salon booking app. Customers pick services, choose a stylist
qualified for **all** of them, book a real fifteen-minute slot on a live
calendar, and get a booking token. Staff manage their own schedule; admins see
everything.

**Stack:** React 19 + Vite + Tailwind CSS v4 on the front end, Express +
MongoDB (Mongoose) + JWT auth on the back end.

---

## What it does

- **Real availability.** Slots are generated server-side in fifteen-minute
  steps between 10:00 and 20:00. A 90-minute treatment blocks the whole 90
  minutes, past times are disabled for today, and anything that would run past
  closing is greyed out.
- **No double-booking, ever.** A unique partial multikey index on
  `{ staff, date, slotKeys }` makes MongoDB itself reject any second booking
  that overlaps an existing one — no read-then-write race, no transaction.
  Cancelling a booking releases its slots immediately.
- **Server-authoritative.** Price, duration, token and payment status are all
  computed on the server from its own price list; the client never sends them.
- **Roles.** `customer` / `staff` / `admin`, enforced on both the API and the
  router. Self-registration always produces a customer.
- **Survives a mid-flow login.** The in-progress booking is mirrored to
  storage, so logging in at the payment step returns you exactly where you were.

---

## Prerequisites

- Node.js 18+
- A MongoDB connection string. The easiest is a free
  [MongoDB Atlas](https://cloud.mongodb.com) cluster — nothing to install
  locally.

---

## Setup

### 1. Install dependencies (front end + server)

```bash
npm run setup
```

(That runs `npm install` here and in `server/`. You can run the two installs
by hand if you prefer.)

### 2. Configure the server

```bash
cd server
cp .env.example .env        # Windows: copy .env.example .env
```

Then edit `server/.env`:

- **`MONGODB_URI`** — your Atlas connection string, e.g.
  `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/salonx?retryWrites=true&w=majority`
  In Atlas: create a free cluster, add a database user, and under **Network
  Access** allow your current IP (or `0.0.0.0/0` for a demo). URL-encode any
  special characters in the password.
- **`JWT_SECRET`** — any long random string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

The front end talks to `http://localhost:5000` by default; override it with a
root `.env` (`VITE_API_URL=`) only if you move the API.

### 3. Run it

```bash
npm run dev
```

This starts the API (`:5000`) and the Vite dev server (`:5173`) together. Open
http://localhost:5173.

On first boot the server seeds services, staff and demo logins (idempotent, so
it's safe on every restart). Re-seed manually any time with `npm run seed`.

---

## Demo logins

All use the password **`Password123`**:

| Role     | Email               |
|----------|---------------------|
| Staff    | `ravi@salonx.com`   |
| Customer | `demo@salonx.com`   |
| Admin    | `admin@salonx.com`  |

Or just create a customer account through the signup form.

---

## Admin panel (hidden)

The admin panel is **not linked anywhere** in the UI and `/admin` is not a
route — it 404s like any other unknown URL. It is served only at a secret path
set by `VITE_ADMIN_PATH` (see the root `.env`), e.g.:

```
http://localhost:5173/sx-console-x7k9q2
```

Reaching the path is not enough: it shows a **lock screen that asks for a
username + password every visit**, verifies the account is an admin, then opens
a **15-minute auto-locking session**. Sign in there with the admin account
above.

> **Security note.** A Vite `VITE_*` value is compiled into the client bundle,
> so the path string itself is discoverable by someone reading the built JS.
> The path is only the first thin layer — the real protection is the credential
> gate, the admin-role check, and the server-side `requireRole("admin")` guard
> on every admin endpoint. Choose your own unguessable `VITE_ADMIN_PATH`.

---

## Security

This build hardens several things worth knowing about:

- **Rotate the shipped credentials.** Earlier `server/.env` held a weak
  `JWT_SECRET` and a live Atlas connection string whose password equalled the
  username. The `JWT_SECRET` has been replaced with a strong random value, and
  the server now refuses to boot with a secret under 32 characters. **You must
  still rotate the MongoDB Atlas database password** in the Atlas console and
  paste the new URI into `server/.env` — treat the old one as compromised.
- **Rate limiting** on `/api/auth/*` (8 attempts / 15 min) and a looser global
  API limiter, via `express-rate-limit`.
- **Security headers** via `helmet`.
- **No stack-trace leaks.** 500 responses only include a stack when
  `DEBUG_ERRORS=true`. Set `NODE_ENV=production` on deploy.
- **Unguessable booking tokens** generated with `crypto.randomInt`; a staff
  account can only read bookings on its own calendar (not enumerate everyone's).
- **Query sanitization** (`express-mongo-sanitize`) plus explicit coercion of
  filter params blocks Mongo operator injection.
- **Timezone.** All availability math uses `SALON_TZ` (default `Asia/Kolkata`),
  so the app is correct no matter what timezone the host runs in.

Known demo trade-offs: the JWT is stored in `localStorage` (readable by any
XSS; prefer an httpOnly cookie in production) and there is no server-side token
revocation (logout is client-side; tokens live for `JWT_EXPIRES_IN`).

---

## Scripts

Root:

| Command            | Does                                             |
|--------------------|--------------------------------------------------|
| `npm run dev`      | API + client together                            |
| `npm run dev:web`  | Client only                                      |
| `npm run dev:api`  | API only                                         |
| `npm run build`    | Production build of the client                   |
| `npm run lint`     | ESLint over client and server                    |
| `npm run seed`     | Re-seed the database                             |
| `npm run setup`    | Install client + server dependencies             |

In `server/`:

| Command           | Does                                              |
|-------------------|---------------------------------------------------|
| `npm run dev`     | Start the API with nodemon                         |
| `npm start`       | Start the API                                      |
| `npm run seed`    | Seed the database                                  |

---

## Project layout

```
.
├── src/                 React app
│   ├── api/             fetch wrapper + one module per endpoint group
│   ├── components/      shared UI (Layout, Navbar, cards, guards, …)
│   ├── context/         AuthProvider + BookingProvider (split .js/.jsx)
│   ├── lib/             storage, time and formatting helpers, useAsync
│   └── pages/           customer / staff / admin / static
└── server/
    └── src/
        ├── config/      env + db connection
        ├── controllers/ auth, service, staff, booking
        ├── middleware/  auth (JWT + roles), error handling
        ├── models/      User, Staff, Service, Booking
        ├── routes/      Express routers
        └── utils/       slot math, service pricing, seed
```

---

## API

| Method | Path                              | Access   |
|--------|-----------------------------------|----------|
| POST   | `/api/auth/register`              | public   |
| POST   | `/api/auth/login`                 | public   |
| GET    | `/api/auth/me`                    | auth     |
| GET    | `/api/services`                   | public   |
| GET    | `/api/staff`                      | public   |
| GET    | `/api/staff/available?serviceIds=`| public   |
| GET    | `/api/bookings/availability`      | public   |
| POST   | `/api/bookings`                   | customer |
| GET    | `/api/bookings/me`                | auth     |
| GET    | `/api/bookings/staff`             | staff    |
| GET    | `/api/bookings`                   | admin    |
| GET    | `/api/bookings/token/:token`      | auth     |
| PATCH  | `/api/bookings/:id/status`        | staff/admin (customer may cancel own) |
