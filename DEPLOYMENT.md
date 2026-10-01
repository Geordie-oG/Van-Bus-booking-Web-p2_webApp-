# 🚀 Deployment Runbook — GoRoute (Van & Bus Booking System)

Branch to deploy: **`main`** (commit `2fd8762`) — this is the complete integrated app
(customer UI + admin portal + API routes).

Deployment-readiness was **verified locally**: clean `npm ci`, production
`npm run build` (24 routes), production server (`next start`) against the live
Atlas database, and live login/API checks.

---

## ⚠️ 0. Pre-deployment fixes — status (branch `fix/security-hardening`)

| # | Item | Status |
|---|---|---|
| 1 | **Rotate the Atlas password** (leaked in public `README.md`) | 🔴 **STILL REQUIRED** — the old password from the README *still authenticates*, so anyone can read/write/delete the database. Atlas → *Database Access* → user `u6711266_db_user` → *Edit Password* → then update `.env.local` and the host's env var. |
| 2 | `README.md` no longer contains the live credential | ✅ Fixed (history still has it → item 1 is what actually matters) |
| 3 | Public registration could self-assign `administrator` | ✅ Fixed — always `customer` unless `ADMIN_INVITE_CODE` matches (`src/app/api/auth/register/route.ts`) |
| 4 | Admin endpoints had no authorization | ✅ Fixed — `requireAdmin()` guard on `POST/PATCH/DELETE /api/vehicles`, `POST/PATCH/DELETE /api/trips`, `GET/POST /api/users` |
| 5 | Booking ownership used forgeable `x-user-id` headers | ✅ Fixed — headers removed from `src/lib/auth.ts`; ownership + list scoping now come from the signed JWT; `POST /api/bookings` takes the owner from the session, not the body |
| 6 | `npm run build` failed without `MONGODB_URI` | ✅ Fixed — env is validated inside `connectDB()` instead of at module import (`src/lib/db.ts`) |
| 7 | Demo accounts `customer@example.com` / `admin@transport.com` (`demo123`) | 🟠 Change the password, or disable them, once the demo/grading is over |

Verified with the 107-check suite (`scripts/api-smoke-test.mjs`) against a
production build: **107/107 passed**, including every guard above and a
regression set proving the previously-open calls now return 401/403.

> **Deploy tip:** merge this branch into `main` first, so the host
> builds the hardened version.

---

## 📌 Environment variables required

| Name | Value | Needed at |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://<user>:<pass>@cluster0.<id>.mongodb.net/van_bus_booking?retryWrites=true&w=majority` | **build AND runtime** |
| `JWT_SECRET` | a long random string (e.g. `openssl rand -base64 32`) | runtime (build safe) |

> **Important:** `src/lib/db.ts` throws `Please define the MONGODB_URI environment
> variable inside .env.local` **at module import time**, and Next.js imports route
> modules during `next build` ("Collecting page data"). So the build **fails**
> unless `MONGODB_URI` is set in the host's build environment too — not only at
> runtime. Verified: `npm run build` → exit 1 without it, exit 0 with it.

---

## 🌐 Atlas network access (required for any cloud host)

Vercel/Render serverless functions use **dynamic outbound IPs**.
Atlas → *Network Access* → *Add IP Address* → **Allow access from anywhere
(`0.0.0.0/0`)**. Without this the app builds but every API call times out.

---

## ✅ Option A — Vercel connected to GitHub (auto-deploy on push) ⭐ recommended

1. Go to <https://vercel.com/signup> → **Continue with GitHub** (authorize).
2. **Add New → Project → Import Git Repository** → choose
   `Geordie-oG/Van-Bus-booking-Web-p2_webApp-`.
3. Framework Preset: **Next.js** (auto-detected). Build `npm run build`,
   install `npm install` — defaults are correct.
4. Expand **Environment Variables** and add (Production + Preview + Development):
   - `MONGODB_URI` = your Atlas URI (ending in `/van_bus_booking?...`)
   - `JWT_SECRET` = a fresh random secret
5. **Deploy.** Result: `https://<project>.vercel.app`.
   Every `git push` to `main` now deploys automatically.

## 🖥️ Option B — Vercel CLI from this folder

```bash
cd "/Users/yehtetaunggeorge/Abac/3rd year/project2 webapp"
npx vercel login                      # you do this once (browser/email)
npx vercel link --yes                 # creates/links the Vercel project
printf '%s' 'mongodb+srv://...' | npx vercel env add MONGODB_URI production
printf '%s' "$(openssl rand -base64 32)" | npx vercel env add JWT_SECRET production
npx vercel --prod --yes               # production deploy, prints the URL
```

## 🐳 Option C — Render / Railway (any Node host)

- Start command: `npm run start` (i.e. `next start`) · Build: `npm run build`
- Env vars: same two as above; health check path `/api/vehicles`
- Free tiers sleep when idle (first request is slow).

## 🔗 Option D — instant temporary public URL (no account, demo only)

Runs the app on this Mac and exposes it through a Cloudflare quick tunnel:

```bash
# terminal 1 — production server with the real DB
MONGODB_URI='<atlas-uri>' JWT_SECRET='<secret>' npm run build && npm run start -p 3000
# terminal 2 — public https URL, no signup required
./cloudflared tunnel --url http://localhost:3000
```
Gives a `https://<random>.trycloudflare.com` link. It dies when this Mac sleeps
or the process stops — fine for a quick demo, not a real deployment.

---

## 🔍 Post-deployment verification

```bash
URL=https://your-app.vercel.app
curl -s -o /dev/null -w '%{http_code}\n' $URL                # 200 landing page
curl -s $URL/api/vehicles | head -c 200                       # fleet JSON from Atlas
curl -s -o /dev/null -w '%{http_code}\n' $URL/trips           # 200
curl -s -X POST $URL/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"customer@example.com","password":"demo123"}'  # 200 + token
BASE=$URL node scripts/api-smoke-test.mjs                     # full 89-check suite
```

If APIs return 500 with `MongooseServerSelectionError`, Atlas IP allow-listing is
the cause (see the network access section above).

---

## 🗄️ Seeding the production database

The `van_bus_booking` database is already seeded (2 users, 2 vehicles, 3 trips,
3 bookings — verified read-only). To reset it deliberately:

```bash
cd "/Users/yehtetaunggeorge/Abac/3rd year/project2 webapp"
MONGODB_URI='<atlas-uri>' npm run seed     # WARNING: wipes all collections first
MONGODB_URI='<atlas-uri>' npm run test:booking   # 9/9 booking tests
```
