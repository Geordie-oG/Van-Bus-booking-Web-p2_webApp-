"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Vehicle {
  _id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  status: string;
}

interface Trip {
  _id: string;
  vehicleId: Vehicle;
  origin: string;
  destination: string;
  departureTime: string;
  fare: number;
  status: string;
}

interface ApiResponse {
  success: boolean;
  data?: Trip[];
  message?: string;
  error?: string;
}

// ============================================================
// TEMPORARY DEMO DATA - REMOVE BEFORE FINAL PUSH
// Used only when the real API/database is unavailable.
// ============================================================

const DEMO_TRIPS: Trip[] = [
  {
    _id: "demo-trip-1",
    vehicleId: {
      _id: "demo-bus-1",
      plateNumber: "BUS-1201",
      type: "bus",
      capacity: 40,
      status: "available",
    },
    origin: "Bangkok",
    destination: "Chiang Mai",
    departureTime: "2026-10-01T08:30:00",
    fare: 650,
    status: "scheduled",
  },
  {
    _id: "demo-trip-2",
    vehicleId: {
      _id: "demo-van-1",
      plateNumber: "VAN-2204",
      type: "van",
      capacity: 12,
      status: "available",
    },
    origin: "Bangkok",
    destination: "Chiang Mai",
    departureTime: "2026-10-01T11:00:00",
    fare: 720,
    status: "scheduled",
  },
  {
    _id: "demo-trip-3",
    vehicleId: {
      _id: "demo-bus-2",
      plateNumber: "BUS-3308",
      type: "bus",
      capacity: 32,
      status: "available",
    },
    origin: "Bangkok",
    destination: "Pattaya",
    departureTime: "2026-10-02T09:15:00",
    fare: 280,
    status: "scheduled",
  },
];

export default function TripsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TripsContent />
    </Suspense>
  );
}

function TripsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const selectedDate = searchParams.get("date") || "";

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("earliest");

  useEffect(() => {
    async function loadTrips() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (origin) params.set("origin", origin);
        if (destination) params.set("destination", destination);

        const response = await fetch(`/api/trips?${params.toString()}`, {
          cache: "no-store",
        });

        // Prevent HTML error pages from causing JSON parsing errors.
        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
          throw new Error("Trip API is currently unavailable.");
        }

        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to retrieve trips.");
        }

        setTrips(result.data || []);
        setDemoMode(false);
      } catch (err) {
        console.warn(
          "Trip API unavailable. Using temporary demo data.",
          err
        );

        // ======================================================
        // TEMPORARY DEMO FALLBACK - REMOVE BEFORE FINAL PUSH
        // ======================================================
        setTrips(DEMO_TRIPS);
        setDemoMode(true);
        setError("");
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, [origin, destination]);

  const displayedTrips = useMemo(() => {
    let filtered = [...trips];

    // Ignore searched date while using demo data.
    if (selectedDate && !demoMode) {
      filtered = filtered.filter(
        (trip) => trip.departureTime.slice(0, 10) === selectedDate
      );
    }

    if (vehicleFilter !== "all") {
      filtered = filtered.filter(
        (trip) =>
          trip.vehicleId?.type?.toLowerCase() === vehicleFilter.toLowerCase()
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === "price-low") {
        return a.fare - b.fare;
      }

      if (sortBy === "price-high") {
        return b.fare - a.fare;
      }

      return (
        new Date(a.departureTime).getTime() -
        new Date(b.departureTime).getTime()
      );
    });

    return filtered;
  }, [trips, selectedDate, vehicleFilter, sortBy, demoMode]);

  return (
    <main className="trips-page">
      <CustomerNavbar />

      <section className="results-hero">
        <div className="results-container">
          <div>
            <span className="results-eyebrow">FIND YOUR JOURNEY</span>
            <h1>Available Trips</h1>
            <p>
              Compare available trips and choose the journey that works for you.
            </p>
          </div>

          <button
            className="modify-search-button"
            onClick={() => router.push("/")}
          >
            ← Modify Search
          </button>
        </div>
      </section>

      <section className="results-section">
        <div className="results-container">
          {demoMode && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#9a3412",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Demo mode: the database is unavailable, so sample trips are being
              displayed for frontend testing.
            </div>
          )}

          <div className="search-summary">
            <div className="summary-location">
              <span className="summary-icon">●</span>

              <div>
                <small>FROM</small>
                <strong>{origin || "Any origin"}</strong>
              </div>
            </div>

            <span className="route-arrow">→</span>

            <div className="summary-location">
              <span className="summary-icon destination-dot">●</span>

              <div>
                <small>TO</small>
                <strong>{destination || "Any destination"}</strong>
              </div>
            </div>

            <div className="summary-separator" />

            <div className="summary-location">
              <span className="calendar-symbol">▣</span>

              <div>
                <small>DEPARTURE</small>
                <strong>
                  {selectedDate
                    ? formatSearchDate(selectedDate)
                    : "Any date"}
                </strong>
              </div>
            </div>
          </div>

          <div className="results-layout">
            <aside className="filters-panel">
              <div className="filter-heading">
                <h3>Filters</h3>

                <button
                  onClick={() => {
                    setVehicleFilter("all");
                    setSortBy("earliest");
                  }}
                >
                  Reset
                </button>
              </div>

              <div className="filter-group">
                <label>VEHICLE TYPE</label>

                <FilterOption
                  label="All vehicles"
                  value="all"
                  current={vehicleFilter}
                  setCurrent={setVehicleFilter}
                />

                <FilterOption
                  label="Bus"
                  value="bus"
                  current={vehicleFilter}
                  setCurrent={setVehicleFilter}
                />

                <FilterOption
                  label="Van"
                  value="van"
                  current={vehicleFilter}
                  setCurrent={setVehicleFilter}
                />
              </div>

              <div className="filter-divider" />

              <div className="filter-group">
                <label>SORT BY</label>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="earliest">Earliest departure</option>
                  <option value="price-low">Lowest price</option>
                  <option value="price-high">Highest price</option>
                </select>
              </div>

              <div className="filter-note">
                <span>✓</span>

                <p>
                  All listed trips are currently scheduled and available for
                  booking.
                </p>
              </div>
            </aside>

            <div className="trip-results">
              <div className="trip-results-heading">
                <div>
                  <h2>
                    {loading
                      ? "Searching trips..."
                      : `${displayedTrips.length} ${
                          displayedTrips.length === 1 ? "trip" : "trips"
                        } found`}
                  </h2>

                  <p>
                    {demoMode
                      ? "Sample journeys for frontend testing"
                      : origin && destination
                      ? `${origin} → ${destination}`
                      : "All scheduled journeys"}
                  </p>
                </div>
              </div>

              {loading && (
                <div className="results-state">
                  <div className="loading-spinner" />
                  <h3>Finding available trips</h3>
                  <p>Please wait while we check scheduled journeys.</p>
                </div>
              )}

              {!loading && error && (
                <div className="results-state error-state">
                  <div className="state-symbol">!</div>
                  <h3>We couldn't load the trips</h3>
                  <p>{error}</p>

                  <button onClick={() => window.location.reload()}>
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && displayedTrips.length === 0 && (
                <div className="results-state">
                  <div className="state-symbol">↔</div>
                  <h3>No trips found</h3>

                  <p>
                    Try another route or departure date to find available
                    journeys.
                  </p>

                  <button onClick={() => router.push("/")}>
                    Change Search
                  </button>
                </div>
              )}

              {!loading &&
                !error &&
                displayedTrips.map((trip) => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    onSelect={() => router.push(`/trips/${trip._id}`)}
                  />
                ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CustomerNavbar() {
  return (
    <header className="navbar">
      <div className="nav-container">
        <a href="/" className="brand">
          <span className="brand-icon">
            <BusIcon />
          </span>

          <span>
            <strong>GoRoute</strong>
            <small>VAN & BUS BOOKING</small>
          </span>
        </a>

        <nav className="nav-links">
          <a href="/">Home</a>

          <a className="active" href="/trips">
            Find Trips
          </a>

          <a href="/bookings">My Bookings</a>
        </nav>

        <div className="nav-actions">
          <a href="/login" className="login-link">
            Log in
          </a>

          <a href="/register" className="primary-button small-button">
            Sign up
          </a>
        </div>
      </div>
    </header>
  );
}

function FilterOption({
  label,
  value,
  current,
  setCurrent,
}: {
  label: string;
  value: string;
  current: string;
  setCurrent: (value: string) => void;
}) {
  return (
    <label className="radio-option">
      <input
        type="radio"
        name="vehicle"
        value={value}
        checked={current === value}
        onChange={() => setCurrent(value)}
      />

      <span className="custom-radio" />

      {label}
    </label>
  );
}

function TripCard({
  trip,
  onSelect,
}: {
  trip: Trip;
  onSelect: () => void;
}) {
  const departure = new Date(trip.departureTime);

  return (
    <article className="trip-card">
      <div className="vehicle-visual">
        <div className="vehicle-circle">
          <BusIcon />
        </div>

        <span>{formatVehicleType(trip.vehicleId?.type)}</span>
      </div>

      <div className="trip-main-info">
        <div className="trip-time">
          <strong>{formatTime(departure)}</strong>
          <span>{formatDate(departure)}</span>
        </div>

        <div className="trip-route-line">
          <div className="route-point">
            <span />
            <strong>{trip.origin}</strong>
          </div>

          <div className="route-track">
            <div />
            <span>→</span>
          </div>

          <div className="route-point destination">
            <span />
            <strong>{trip.destination}</strong>
          </div>
        </div>

        <div className="trip-meta">
          <span>
            <BusMiniIcon />
            {formatVehicleType(trip.vehicleId?.type)}
          </span>

          {trip.vehicleId?.capacity && (
            <span>
              <SeatMiniIcon />
              {trip.vehicleId.capacity} seats
            </span>
          )}

          {trip.vehicleId?.plateNumber && (
            <span className="plate-number">
              {trip.vehicleId.plateNumber}
            </span>
          )}
        </div>
      </div>

      <div className="trip-price">
        <small>FARE FROM</small>

        <div>
          <strong>฿{formatPrice(trip.fare)}</strong>
          <span>/ seat</span>
        </div>

        <span className="scheduled-badge">Available</span>

        <button onClick={onSelect}>
          View Seats
          <span>→</span>
        </button>
      </div>
    </article>
  );
}

function LoadingScreen() {
  return (
    <main className="trips-page">
      <CustomerNavbar />

      <div className="results-state full-loading">
        <div className="loading-spinner" />
        <h3>Loading trips</h3>
      </div>
    </main>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSearchDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return Number(price || 0).toLocaleString();
}

function formatVehicleType(type?: string) {
  if (!type) return "Vehicle";

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function BusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2h-1v2a1 1 0 0 1-2 0v-2H8v2a1 1 0 0 1-2 0v-2H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v5h14V6a1 1 0 0 0-1-1H6Zm-.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

function BusMiniIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 3h14a2 2 0 0 1 2 2v12h-2v2h-2v-2H7v2H5v-2H3V5a2 2 0 0 1 2-2Zm0 2v6h14V5H5Zm2 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

function SeatMiniIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M7 4a3 3 0 0 1 3 3v5h5V7a3 3 0 0 1 6 0v9a4 4 0 0 1-4 4H7v2H5v-2H3v-7a2 2 0 1 1 4 0v3h10a1 1 0 0 0 1-1V7a1 1 0 1 0-2 0v7H8V7a1 1 0 0 0-2 0v3H4V7a3 3 0 0 1 3-3Z" />
    </svg>
  );
}