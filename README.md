# Van and Bus Booking System

A full-stack web application built with **Next.js 15**, **MongoDB**, **Mongoose**, and **Tailwind CSS** for managing van and bus transport reservations.

---

## Features

- **Booking CRUD** — `GET/POST /api/bookings` and `GET/PATCH/DELETE /api/bookings/:id`
- **Seat Availability** — `GET /api/trips/:id/availability` returns booked seats, capacity, and remaining vacancy
- **Interactive Seat Map** — Color-coded van/bus cabin layout (Available / Selected / Booked)
- **Duplicate-Seat Prevention** — Compound partial unique MongoDB index on `(tripId, seatNumbers)` with `status $in [confirmed, pending]`
- **Booking Confirmation** — In-app confirmation screen after successful reservation
- **Cancellation & Seat Release** — Customers can cancel before departure; seats are instantly released
- **Departed Trip Guard** — Bookings rejected for departed or completed trips
- **Capacity Validation** — Seat numbers outside vehicle capacity are rejected server-side
- **Auth System** — JWT cookie-based auth with `bcryptjs`; customer and administrator roles
- **Admin Portal** — View all bookings, manage vehicles and trips

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and set your MongoDB URI:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/van_bus_booking
JWT_SECRET=your_secret_here
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run seed` | Seed vehicles, trips, users, and bookings |
| `npm run test:booking` | Run duplicate-seat prevention and CRUD tests |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | MongoDB Atlas + Mongoose 8 |
| Auth | bcryptjs + jsonwebtoken (HTTP-only cookie) |
| UI | React 19 + Tailwind CSS + Lucide Icons |
| Language | TypeScript |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # login, register, logout, me
│   │   ├── bookings/       # CRUD + status update
│   │   ├── trips/          # CRUD + availability
│   │   ├── vehicles/       # CRUD
│   │   └── users/          # user management
│   ├── admin/
│   │   ├── bookings/       # admin booking overview
│   │   ├── trips/          # trip scheduling
│   │   └── vehicles/       # vehicle fleet
│   ├── trips/              # browse trips + seat booking UI
│   ├── my-bookings/        # customer booking history
│   ├── login/              # sign in
│   └── register/           # register
├── components/
│   ├── SeatSelector.tsx    # interactive seat map
│   ├── BookingForm.tsx     # booking form with validation
│   └── BookingConfirmation.tsx
├── context/
│   └── AuthContext.tsx     # auth state provider
├── lib/
│   ├── db.ts               # Mongoose connection singleton
│   ├── auth.ts             # JWT helpers
│   └── api-response.ts     # standard JSON response helpers
└── models/
    ├── Booking.ts
    ├── Trip.ts
    ├── Vehicle.ts
    └── User.ts
```