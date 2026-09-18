# Van and Bus Booking System

**CSX4107 (542) | Web Application Development — Project 2**  
*Next.js + React, MongoDB + Mongoose, RESTful APIs, Responsive UI*

---

## 👨‍💻 Module Ownership: Member 2 — Ye Htet Aung
**Role**: Booking and Seat Availability Lead  
**Branch**: `feature/booking-seat-availability`  
**Main Objective**: Build the reservation workflow and guarantee that seats cannot be double-booked or assigned incorrectly.

---

## 🚀 Key Features Implemented by Ye Htet Aung

### 1. Zero Duplicate-Booking Protection (Race-Condition Safe)
- Enforces a MongoDB **compound partial unique index** on `{ tripId: 1, seatNumbers: 1 }` with `{ partialFilterExpression: { status: { $ne: "cancelled" } } }`.
- Any simultaneous or concurrent request attempting to claim the same seat on the same trip triggers MongoDB duplicate key error `11000`, cleanly caught and returned as `409 Conflict`.
- Server-side pre-validation verifies trip status (`scheduled`), future departure time, and vehicle capacity bounds.

### 2. Live Seat Availability API
- **Endpoint**: `GET /api/trips/:id/availability`
- Computes vehicle capacity, booked seats list (`bookedSeats`), available seat numbers (`availableSeats`), and remaining vacancy count in real time.
- Excludes cancelled bookings so seats are instantly freed.

### 3. Booking CRUD REST APIs
- `GET /api/bookings`: Query customer bookings (with role-based access; customers see their own, admins see all).
- `POST /api/bookings`: Validates payload, checks trip schedule, verifies seat capacity, enforces duplicate-seat prevention, and creates the reservation.
- `GET /api/bookings/:id`: Retrieve full booking details with populated trip and vehicle information.
- `PATCH /api/bookings/:id`: Update booking status (confirm, cancel) with departure-time validation.
- `DELETE /api/bookings/:id`: Cancel booking before departure and release seats.

### 4. Interactive Seat Layout & Confirmation UI
- **Seat Selector Component**: Realistic vehicle cabin layout (driver seat, aisles, rows) displaying Available, Selected, and Booked states.
- **Booking Form**: Passenger details, dynamic fare tally (`Unit Fare × Seats = Total`).
- **In-Application Confirmation**: Full ticket receipt with Booking ID, route, date/time, vehicle plate, and seat numbers.
- **My Bookings Dashboard**: Customer view with one-click cancellation before departure time.
- **Admin Dashboard**: Manage all reservations and update statuses.

---

## 📁 Project Structure

```text
├── scripts/
│   ├── seed.ts                     # Seeds test vehicles, trips, users, and bookings
│   └── test-duplicate-booking.ts   # Automated test suite for concurrency & seat release
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── bookings/           # GET/POST /api/bookings
│   │   │   │   └── [id]/           # GET/PATCH/DELETE /api/bookings/:id
│   │   │   ├── trips/              # GET/POST /api/trips
│   │   │   │   └── [id]/
│   │   │   │       └── availability/ # GET /api/trips/:id/availability
│   │   │   └── vehicles/           # GET/POST /api/vehicles
│   │   ├── my-bookings/            # Customer bookings & cancellation dashboard
│   │   ├── trips/                  # Scheduled trips listing & search
│   │   │   └── [id]/book/          # Interactive seat selection & reservation page
│   │   ├── admin/bookings/         # Administrator bookings overview
│   │   ├── layout.tsx              # Application layout & navigation
│   │   └── page.tsx                # Landing page showcasing Member 2 deliverables
│   ├── components/
│   │   ├── SeatSelector.tsx        # Interactive van/bus cabin seat grid
│   │   ├── BookingForm.tsx         # Passenger details and payment form
│   │   └── BookingConfirmation.tsx # In-app confirmation voucher
│   ├── lib/
│   │   ├── db.ts                   # Mongoose connection singleton
│   │   └── api-response.ts         # Standardized JSON response helper
│   └── models/
│       ├── Booking.ts              # Booking schema with unique partial index
│       ├── Trip.ts                 # Trip model
│       ├── Vehicle.ts              # Vehicle model
│       └── User.ts                 # User model
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and set your MongoDB URI:
```env
MONGODB_URI=mongodb://localhost:27017/van_bus_booking
JWT_SECRET=super_secret_jwt_key_csx4107_project2
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Sample Data
Populate vehicles, scheduled trips, and initial bookings:
```bash
npm run seed
```

### 4. Run Automated Concurrency & Duplicate Prevention Tests
```bash
npm run test:booking
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Minimum Acceptance Test Evidence

| Test Check | Requirement | Result |
| :--- | :--- | :--- |
| **Availability** | Returns total capacity, booked seats, and remaining seats | ✅ Pass |
| **Booking Creation** | Customer books available seats with validated payload | ✅ Pass |
| **Duplicate Prevention** | Rejects double-booking identical seat on the same trip | ✅ Pass |
| **Race Protection** | Unique index rejects concurrent claims (MongoDB E11000) | ✅ Pass |
| **Capacity Limit** | Rejects seat numbers exceeding vehicle capacity | ✅ Pass |
| **Departed Trips** | Rejects bookings for past or departed trips | ✅ Pass |
| **Seat Release** | Cancelled booking releases seats for future bookings | ✅ Pass |
| **Cancellation Policy** | Trips that already departed cannot be cancelled | ✅ Pass |