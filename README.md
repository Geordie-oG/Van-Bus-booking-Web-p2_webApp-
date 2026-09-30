# 🚍 Van and Bus Booking System

A full-stack web application built with **Next.js 15 (App Router)**, **MongoDB Atlas**, **Mongoose 8**, and **Tailwind CSS** for managing van and bus transport reservations, seat availability, and fleet operations.

---

## 👥 Team Task Division (CSX4107 - Project 2)

| Member | Role | Ownership & Deliverables |
|---|---|---|
| **Li Hout Van** | Vehicle & Trip Management Lead | Vehicle CRUD, Trip scheduling, Fleet capacity & status, Admin transport pages |
| **Ye Htet Aung** | Booking & Seat Availability Lead | Booking CRUD, Seat availability API, Duplicate-seat race condition protection, Cancellation & seat release logic |
| **Zaw Zaw Naing** | Authentication, Customer UI & Integration | JWT Authentication, Customer pages, Route protection, Responsive UI, Full API Integration |

---

## 🌟 Key Features

- **Booking & Seat Management** — `GET/POST /api/bookings` and `GET/PATCH/DELETE /api/bookings/:id`
- **Real-Time Seat Availability** — `GET /api/trips/:id/availability` calculates booked seats, total capacity, and remaining available seat numbers.
- **Zero-Duplicate Concurrency Protection** — Compound partial unique MongoDB index on `(tripId, seatNumbers)` with `status $in ["confirmed", "pending"]` to prevent double-booking at database level.
- **Business Rule Enforcement**:
  - Seat capacity boundaries enforced against vehicle specification.
  - Automatic seat release upon booking cancellation.
  - Departed or completed trips strictly reject new reservations.
- **Authentication & Authorization** — JWT-based authentication using `bcryptjs` and `jsonwebtoken` with HTTP-Only cookies and Bearer token headers. Role support for `customer` and `administrator`.
- **Fleet & Trip Management** — Admin vehicle tracking (plate number uniqueness, capacity, status) and trip scheduling.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, React 19) |
| **Database** | MongoDB Atlas Cloud + Mongoose 8 ORM |
| **Authentication** | JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`) |
| **Styling** | Tailwind CSS + Lucide React Icons |
| **Scripting / Testing** | TypeScript + `tsx` test runners |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd project2-webapp
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root (or copy from `.env.example`):

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://u6711266_db_user:abac2026webp@cluster0.epkwrwx.mongodb.net/van_bus_booking?retryWrites=true&w=majority&appName=Cluster0

# JWT Authentication Secret
JWT_SECRET=super_secret_jwt_key_csx4107_project2

# Next App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Database
Populate MongoDB Atlas with initial fleet vehicles, scheduled trips, demo users, and bookings:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Accounts

After running `npm run seed`, use these seeded credentials:

| Account Type | Email | Password | Role |
|---|---|---|---|
| **Customer** | `customer@example.com` | `demo123` | `customer` |
| **Administrator** | `admin@transport.com` | `demo123` | `administrator` |

---

## 📡 REST API Reference

All API responses follow a standardized JSON envelope:
- **Success (20x):** `{ "success": true, "data": ..., "message": "..." }`
- **Error (40x / 50x):** `{ "success": false, "error": "..." }`

### 🔒 Auth Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new customer or admin account |
| `POST` | `/api/auth/login` | Authenticate user & issue HTTP-only JWT cookie + token |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### 💺 Booking & Availability Endpoints (Member 2 Lead)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips/:id/availability` | Get trip seat availability, capacity & booked seats list |
| `GET` | `/api/bookings` | List bookings (filters: `tripId`, `userId`, `status`) |
| `POST` | `/api/bookings` | Create new reservation (validates seats, capacity, status, duplicate index) |
| `GET` | `/api/bookings/:id` | View booking details |
| `PATCH` | `/api/bookings/:id` | Update booking status (`confirmed`, `cancelled`, `pending`) |
| `DELETE` | `/api/bookings/:id` | Cancel booking before departure & release seats |

### 🚌 Vehicle & Trip Endpoints (Member 1 Lead)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | List all fleet vehicles |
| `POST` | `/api/vehicles` | Add new vehicle (plateNumber, type, capacity) |
| `GET / PATCH / DELETE` | `/api/vehicles/:id` | View, edit, or deactivate a vehicle |
| `GET` | `/api/trips` | Search/filter scheduled trips (`origin`, `destination`, `status`) |
| `POST` | `/api/trips` | Schedule a new trip |
| `GET / PATCH / DELETE` | `/api/trips/:id` | View, edit, or cancel a trip (cancelling a trip auto-cancels bookings) |

---

## 🧪 Testing Scripts

| Command | Description |
|---|---|
| `npm run seed` | Clear and seed database in MongoDB Atlas |
| `npm run test:booking` | Execute automated seat availability, capacity bounds, and duplicate-booking test suite |
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build application for production deployment |

To run full backend API smoke test against a running local server:
```bash
BASE=http://localhost:3000 node scripts/api-smoke-test.mjs
```

---

## 📁 Project Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, register, logout, me routes
│   │   ├── bookings/       # Booking CRUD & cancellation
│   │   ├── trips/          # Trip CRUD & /:id/availability
│   │   ├── vehicles/       # Vehicle fleet management
│   │   └── users/          # User management
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts               # Mongoose connection singleton
│   ├── auth.ts             # JWT signing & verification helpers
│   └── api-response.ts     # Standardized JSON response helpers
├── models/
│   ├── Booking.ts          # Booking schema with partial unique index
│   ├── Trip.ts             # Trip schema referencing Vehicle
│   ├── Vehicle.ts          # Vehicle schema with unique plate constraint
│   ├── User.ts             # User schema with bcrypt password hash
│   └── index.ts            # Centralized model exports
scripts/
├── seed.ts                 # Database seed script
├── test-duplicate-booking.ts # Concurrency & seat protection test suite
└── api-smoke-test.mjs      # Comprehensive API smoke test
```