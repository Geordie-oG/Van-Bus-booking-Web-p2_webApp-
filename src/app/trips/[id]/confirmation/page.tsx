"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Vehicle {
  plateNumber: string;
  type: string;
  capacity: number;
}

interface Trip {
  _id: string;
  origin: string;
  destination: string;
  departureTime: string;
  fare: number;
  vehicleId: Vehicle;
}

interface User {
  _id?: string;
  name: string;
  email: string;
}

interface Booking {
  _id: string;
  tripId: Trip;
  userId: User;
  seatNumbers: number[];
  passengerName: string;
  status: string;
  createdAt?: string;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) {
        setError("Booking reference is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || result.error || "Unable to load booking"
          );
        }

        setBooking(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load booking"
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-state">Loading booking...</div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-state">
          <h2>Unable to load booking</h2>
          <p>{error}</p>
          <Link href="/">Return Home</Link>
        </div>
      </main>
    );
  }

  const trip = booking.tripId;
  const vehicle = trip.vehicleId;

  const departure = new Date(trip.departureTime);

  const total =
    typeof trip.fare === "number"
      ? trip.fare * booking.seatNumbers.length
      : null;

  return (
    <main className="confirmation-page">
      <div className="confirmation-container">
        <Link href="/" className="confirmation-logo">
          GoRoute
        </Link>

        <div className="booking-steps">
          <div className="booking-step completed">
            <span>✓</span>
            <p>Select Seats</p>
          </div>

          <div className="step-line completed" />

          <div className="booking-step completed">
            <span>✓</span>
            <p>Passenger Details</p>
          </div>

          <div className="step-line completed" />

          <div className="booking-step active">
            <span>3</span>
            <p>Confirmation</p>
          </div>
        </div>

        <section className="confirmation-card">
          <div className="success-icon">✓</div>

          <h1>Booking Confirmed!</h1>

          <p className="confirmation-subtitle">
            Your journey has been successfully booked.
          </p>

          <div className="booking-reference">
            <span>Booking Reference</span>
            <strong>{booking._id}</strong>
          </div>

          <div className="confirmation-route">
            <div>
              <span>FROM</span>
              <strong>{trip.origin}</strong>
            </div>

            <div className="route-arrow">→</div>

            <div>
              <span>TO</span>
              <strong>{trip.destination}</strong>
            </div>
          </div>

          <div className="confirmation-grid">
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
                {vehicle?.type || "Vehicle"}{" "}
                {vehicle?.plateNumber ? `• ${vehicle.plateNumber}` : ""}
              </strong>
            </div>

            <div>
              <span>Passenger</span>
              <strong>{booking.passengerName}</strong>
            </div>

            <div>
              <span>Seat(s)</span>
              <strong>{booking.seatNumbers.join(", ")}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong className="confirmed-text">{booking.status}</strong>
            </div>
          </div>

          {total !== null && (
            <div className="confirmation-total">
              <span>Total Paid</span>
              <strong>฿{total.toLocaleString()}</strong>
            </div>
          )}

          <div className="confirmation-actions">
            <Link href="/bookings" className="primary-action">
              View My Bookings
            </Link>

            <Link href="/" className="secondary-action">
              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="confirmation-page">
          <div className="confirmation-state">Loading booking...</div>
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}