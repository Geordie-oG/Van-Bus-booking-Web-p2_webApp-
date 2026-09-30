"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface AuthUser {
  userId?: string;
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Vehicle {
  plateNumber: string;
  type: string;
}

interface Trip {
  _id: string;
  origin: string;
  destination: string;
  departureTime: string;
  fare: number;
  vehicleId: Vehicle;
}

interface Booking {
  _id: string;
  tripId: Trip;
  seatNumbers: number[];
  passengerName: string;
  status: string;
  createdAt?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState("");

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const authResponse = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const authResult = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error("Please log in to view your bookings.");
      }

      const currentUser: AuthUser = authResult.data;
      setUser(currentUser);

      const userId =
        currentUser.userId || currentUser._id || currentUser.id;

      if (!userId) {
        throw new Error("Unable to identify the logged-in user.");
      }

      const response = await fetch(
        `/api/bookings?userId=${encodeURIComponent(userId)}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Unable to load bookings"
        );
      }

      setBookings(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load bookings"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function cancelBooking(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setCancelling(id);

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Unable to cancel booking"
        );
      }

      await loadBookings();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Unable to cancel booking"
      );
    } finally {
      setCancelling("");
    }
  }

  return (
    <main className="bookings-page">
      <header className="bookings-header">
        <Link href="/" className="bookings-logo">
          GoRoute
        </Link>

        <div className="bookings-nav">
          {user?.name && <span>Hello, {user.name}</span>}
          <Link href="/">Find Trips</Link>
        </div>
      </header>

      <section className="bookings-hero">
        <div>
          <p className="eyebrow">YOUR JOURNEYS</p>
          <h1>My Bookings</h1>
          <p>View and manage your upcoming trips.</p>
        </div>
      </section>

      <section className="bookings-container">
        {loading && (
          <div className="bookings-empty">Loading your bookings...</div>
        )}

        {!loading && error && (
          <div className="bookings-empty">
            <h2>Sign in required</h2>
            <p>{error}</p>
            <Link href="/login" className="primary-action">
              Sign In
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="bookings-empty">
            <h2>No bookings yet</h2>
            <p>Your booked journeys will appear here.</p>
            <Link href="/" className="primary-action">
              Find a Trip
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          bookings.map((booking) => {
            const trip = booking.tripId;

            if (!trip) return null;

            const departure = new Date(trip.departureTime);
            const isCancelled = booking.status === "cancelled";

            return (
              <article className="my-booking-card" key={booking._id}>
                <div className="my-booking-top">
                  <div>
                    <span className="booking-id-label">BOOKING REFERENCE</span>
                    <strong>{booking._id}</strong>
                  </div>

                  <span
                    className={`booking-status ${
                      isCancelled ? "cancelled" : "confirmed"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="my-booking-route">
                  <div>
                    <span>FROM</span>
                    <h2>{trip.origin}</h2>
                  </div>

                  <div className="booking-route-line">
                    <span>→</span>
                  </div>

                  <div>
                    <span>TO</span>
                    <h2>{trip.destination}</h2>
                  </div>
                </div>

                <div className="my-booking-details">
                  <div>
                    <span>Date</span>
                    <strong>
                      {departure.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </strong>
                  </div>

                  <div>
                    <span>Departure</span>
                    <strong>
                      {departure.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </div>

                  <div>
                    <span>Vehicle</span>
                    <strong>
                      {trip.vehicleId?.type || "Vehicle"}{" "}
                      {trip.vehicleId?.plateNumber
                        ? `• ${trip.vehicleId.plateNumber}`
                        : ""}
                    </strong>
                  </div>

                  <div>
                    <span>Seats</span>
                    <strong>{booking.seatNumbers.join(", ")}</strong>
                  </div>

                  <div>
                    <span>Passenger</span>
                    <strong>{booking.passengerName}</strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>
                      ฿
                      {(
                        (trip.fare || 0) * booking.seatNumbers.length
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {!isCancelled && (
                  <div className="booking-card-actions">
                    <button
                      className="cancel-booking-button"
                      onClick={() => cancelBooking(booking._id)}
                      disabled={cancelling === booking._id}
                    >
                      {cancelling === booking._id
                        ? "Cancelling..."
                        : "Cancel Booking"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
      </section>
    </main>
  );
}