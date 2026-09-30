"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  use,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Vehicle {
  _id?: string;
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
  status: string;
  vehicleId: Vehicle;
}

interface AuthUser {
  userId?: string;
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

function PassengerContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const [passengerName, setPassengerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedSeats = (searchParams.get("seats") || "")
    .split(",")
    .map((seat) => Number(seat))
    .filter((seat) => Number.isInteger(seat) && seat > 0);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const [tripResponse, authResponse] = await Promise.all([
          fetch(`/api/trips/${id}`, {
            cache: "no-store",
          }),
          fetch("/api/auth/me", {
            cache: "no-store",
          }),
        ]);

        const tripResult = await tripResponse.json();

        if (!tripResponse.ok) {
          throw new Error(
            tripResult.message ||
              tripResult.error ||
              "Unable to load trip"
          );
        }

        setTrip(tripResult.data);

        /*
         * Authentication is handled separately because the trip
         * should still be visible even if the user is not logged in.
         */
        if (authResponse.ok) {
          const authResult = await authResponse.json();
          const currentUser: AuthUser = authResult.data;

          setAuthUser(currentUser);

          if (currentUser?.name) {
            setPassengerName(currentUser.name);
          }

          if (currentUser?.email) {
            setEmail(currentUser.email);
          }
        } else {
          setAuthUser(null);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load passenger details"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!trip) {
      setError("Trip information is unavailable.");
      return;
    }

    if (selectedSeats.length === 0) {
      setError("No seats have been selected.");
      return;
    }

    if (!passengerName.trim()) {
      setError("Please enter the passenger name.");
      return;
    }

    if (passengerName.trim().length < 2) {
      setError("Passenger name must be at least 2 characters long.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!authUser) {
      setError("Please log in before confirming your booking.");
      return;
    }

    /*
     * /api/auth/me returns userId from the JWT payload.
     * _id/id are kept as fallbacks in case the API response
     * changes later.
     */
    const userId =
      authUser.userId || authUser._id || authUser.id;

    if (!userId) {
      setError("Unable to identify the logged-in user.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: id,
          userId,
          seatNumbers: selectedSeats,
          passengerName: passengerName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Unable to confirm booking"
        );
      }

      const booking = result.data;

      if (!booking?._id) {
        throw new Error(
          "Booking was created but no booking ID was returned."
        );
      }

      router.push(
        `/trips/${id}/confirmation?booking=${booking._id}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm booking"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="passenger-page">
        <div className="passenger-container">
          <div className="passenger-loading">
            Loading passenger details...
          </div>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="passenger-page">
        <div className="passenger-container">
          <div className="passenger-loading">
            <h2>Unable to load trip</h2>
            <p>{error || "Trip information is unavailable."}</p>

            <Link href="/trips">Back to Trips</Link>
          </div>
        </div>
      </main>
    );
  }

  const departure = new Date(trip.departureTime);

  const total = selectedSeats.length * trip.fare;

  return (
    <main className="passenger-page">
      <div className="passenger-container">
        <div className="passenger-topbar">
          <Link href="/" className="passenger-logo">
            GoRoute
          </Link>

          <Link
            href={`/trips/${id}`}
            className="passenger-back"
          >
            ← Back to Seats
          </Link>
        </div>

        <div className="booking-steps">
          <div className="booking-step completed">
            <span>✓</span>
            <p>Select Seats</p>
          </div>

          <div className="step-line completed" />

          <div className="booking-step active">
            <span>2</span>
            <p>Passenger Details</p>
          </div>

          <div className="step-line" />

          <div className="booking-step">
            <span>3</span>
            <p>Confirmation</p>
          </div>
        </div>

        {!authUser && (
          <div className="demo-notice">
            <strong>Login required</strong>
            <span>
              Please{" "}
              <Link href="/login">sign in</Link>{" "}
              before confirming your booking.
            </span>
          </div>
        )}

        <div className="passenger-layout">
          <section className="passenger-form-card">
            <div className="passenger-section-heading">
              <p>PASSENGER INFORMATION</p>
              <h1>Who&apos;s travelling?</h1>
              <span>
                Enter the contact details for this booking.
              </span>
            </div>

            {error && (
              <div className="passenger-error">
                {error}
              </div>
            )}

            <form
              className="passenger-form"
              onSubmit={handleSubmit}
            >
              <div className="passenger-field">
                <label htmlFor="passengerName">
                  Passenger Name
                </label>

                <input
                  id="passengerName"
                  type="text"
                  placeholder="Full name"
                  value={passengerName}
                  onChange={(event) =>
                    setPassengerName(event.target.value)
                  }
                  required
                />
              </div>

              <div className="passenger-field">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>

              <div className="passenger-field">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  placeholder="+66 81 234 5678"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="confirm-booking-button"
                disabled={submitting}
              >
                {submitting
                  ? "Confirming Booking..."
                  : "Confirm Booking"}
              </button>
            </form>
          </section>

          <aside className="passenger-summary-card">
            <p className="summary-label">
              BOOKING SUMMARY
            </p>

            <div className="passenger-route">
              <div>
                <span>FROM</span>
                <strong>{trip.origin}</strong>
              </div>

              <div className="passenger-route-arrow">
                →
              </div>

              <div>
                <span>TO</span>
                <strong>{trip.destination}</strong>
              </div>
            </div>

            <div className="passenger-trip-info">
              <div>
                <span>Date</span>
                <strong>
                  {departure.toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    }
                  )}
                </strong>
              </div>

              <div>
                <span>Departure</span>
                <strong>
                  {departure.toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </strong>
              </div>

              <div>
                <span>Vehicle</span>
                <strong>
                  {trip.vehicleId?.type || "Vehicle"}
                </strong>
              </div>

              <div>
                <span>Plate</span>
                <strong>
                  {trip.vehicleId?.plateNumber || "—"}
                </strong>
              </div>
            </div>

            <div className="passenger-seats-summary">
              <span>Selected Seats</span>

              <div className="passenger-seat-list">
                {selectedSeats.map((seat) => (
                  <strong key={seat}>{seat}</strong>
                ))}
              </div>
            </div>

            <div className="passenger-price-row">
              <span>
                ฿{trip.fare.toLocaleString()} ×{" "}
                {selectedSeats.length}
              </span>

              <strong>
                ฿{total.toLocaleString()}
              </strong>
            </div>

            <div className="passenger-total-row">
              <span>Total</span>

              <strong>
                ฿{total.toLocaleString()}
              </strong>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function PassengerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="passenger-page">
          <div className="passenger-container">
            Loading passenger details...
          </div>
        </main>
      }
    >
      <PassengerContent params={params} />
    </Suspense>
  );
}