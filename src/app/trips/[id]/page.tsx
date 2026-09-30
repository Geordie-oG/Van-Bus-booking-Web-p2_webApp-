"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";


interface Vehicle {
  _id?: string;
  plateNumber: string;
  type: "van" | "bus";
  capacity: number;
  status?: string;
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

interface Availability {
  tripId: string;
  origin: string;
  destination: string;
  departureTime: string;
  status: string;
  vehicle: {
    plateNumber: string;
    type: "van" | "bus";
    capacity: number;
  };
  totalCapacity: number;
  bookedSeats: number[];
  availableSeats: number[];
  remainingCapacity: number;
  isBookingAllowed: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}


export default function SeatSelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [availability, setAvailability] =
    useState<Availability | null>(null);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrip() {
      try {
        setLoading(true);
        setError("");

        const [availabilityResponse, tripResponse] = await Promise.all([
          fetch(`/api/trips/${id}/availability`, {
            cache: "no-store",
          }),

          fetch(`/api/trips/${id}`, {
            cache: "no-store",
          }),
        ]);

        const availabilityContentType =
          availabilityResponse.headers.get("content-type");

        const tripContentType =
          tripResponse.headers.get("content-type");

        if (
          !availabilityContentType?.includes("application/json") ||
          !tripContentType?.includes("application/json")
        ) {
          throw new Error("Trip API is currently unavailable.");
        }

        const availabilityResult: ApiResponse<Availability> =
          await availabilityResponse.json();

        const tripResult: ApiResponse<Trip> =
          await tripResponse.json();

        if (
          !availabilityResponse.ok ||
          !availabilityResult.success ||
          !availabilityResult.data
        ) {
          throw new Error(
            availabilityResult.error ||
              "Unable to retrieve seat availability."
          );
        }

        if (
          !tripResponse.ok ||
          !tripResult.success ||
          !tripResult.data
        ) {
          throw new Error(
            tripResult.error ||
              "Unable to retrieve trip information."
          );
        }

        setAvailability(availabilityResult.data);
        setTrip(tripResult.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the trip."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTrip();
  }, [id]);

  const bookedSeats = useMemo(
    () => new Set(availability?.bookedSeats || []),
    [availability]
  );

  function toggleSeat(seat: number) {
    if (bookedSeats.has(seat)) return;
    if (!availability?.isBookingAllowed) return;

    setSelectedSeats((current) =>
      current.includes(seat)
        ? current.filter((number) => number !== seat)
        : [...current, seat].sort((a, b) => a - b)
    );
  }

  function continueBooking() {
    if (!selectedSeats.length) return;

    const query = new URLSearchParams({
      seats: selectedSeats.join(","),
    });

    router.push(`/trips/${id}/passenger?${query.toString()}`);
  }

  if (loading) {
    return (
      <main className="seat-page">
      <Navbar />

        <div className="seat-loading">
          <div className="loading-spinner" />

          <h3>Loading seat availability</h3>

          <p>Checking available seats for your journey...</p>
        </div>
      </main>
    );
  }

  if (error || !availability || !trip) {
    return (
      <main className="seat-page">
      <Navbar />

        <div className="seat-loading">
          <div className="state-symbol">!</div>

          <h3>Unable to load this trip</h3>

          <p>{error || "Trip information is unavailable."}</p>

          <button
            className="seat-back-button"
            onClick={() => router.push("/trips")}
          >
            Back to Trips
          </button>
        </div>
      </main>
    );
  }

  const departure = new Date(availability.departureTime);

  const totalPrice = selectedSeats.length * trip.fare;

  return (
    <main className="seat-page">
      <Navbar />


      <section className="seat-topbar">
        <div className="seat-container">
          <button
            className="back-link"
            onClick={() => router.back()}
          >
            ← Back to trips
          </button>

          <div className="booking-steps">
            <Step
              number="1"
              label="Select Seats"
              active
            />

            <div className="step-line" />

            <Step
              number="2"
              label="Passenger Details"
            />

            <div className="step-line" />

            <Step
              number="3"
              label="Confirmation"
            />
          </div>
        </div>
      </section>

      <section className="seat-content">
        <div className="seat-container">
          <div className="seat-heading">
            <div>
              <span className="results-eyebrow">
                CHOOSE YOUR SEAT
              </span>

              <h1>Select your seats</h1>

              <p>
                Choose one or more available seats for your journey.
              </p>
            </div>

            <div className="remaining-badge">
              <strong>
                {availability.remainingCapacity}
              </strong>

              <span>seats remaining</span>
            </div>
          </div>

          <div className="seat-layout">
            <div className="seat-map-card">
              <div className="seat-card-header">
                <div>
                  <h2>
                    {availability.vehicle.type === "van"
                      ? "Van"
                      : "Bus"}{" "}
                    Seat Map
                  </h2>

                  <p>
                    {availability.vehicle.plateNumber} ·{" "}
                    {availability.totalCapacity} seats
                  </p>
                </div>

                <div className="seat-legend">
                  <Legend
                    className="available"
                    label="Available"
                  />

                  <Legend
                    className="selected"
                    label="Selected"
                  />

                  <Legend
                    className="booked"
                    label="Booked"
                  />
                </div>
              </div>

              {!availability.isBookingAllowed && (
                <div className="booking-disabled-message">
                  Booking is no longer available for this trip.
                </div>
              )}

              <div className="vehicle-shell">
                <div className="vehicle-front">
                  <div>
                    <span>FRONT</span>
                    <strong>Driver</strong>
                  </div>

                  <div className="steering-wheel">
                    ◉
                  </div>
                </div>

                <div className="seat-map">
                  {createSeatRows(
                    availability.totalCapacity,
                    availability.vehicle.type
                  ).map((row, index) => (
                    <div
                      className="seat-row"
                      key={index}
                    >
                      <span className="row-number">
                        {index + 1}
                      </span>

                      <div className="seat-side">
                        {row.left.map((seat) => (
                          <Seat
                            key={seat}
                            number={seat}
                            booked={bookedSeats.has(seat)}
                            selected={selectedSeats.includes(seat)}
                            disabled={!availability.isBookingAllowed}
                            onClick={() => toggleSeat(seat)}
                          />
                        ))}
                      </div>

                      <div className="seat-aisle">
                        <span>•</span>
                      </div>

                      <div className="seat-side">
                        {row.right.map((seat) => (
                          <Seat
                            key={seat}
                            number={seat}
                            booked={bookedSeats.has(seat)}
                            selected={selectedSeats.includes(seat)}
                            disabled={!availability.isBookingAllowed}
                            onClick={() => toggleSeat(seat)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="vehicle-rear">
                  REAR
                </div>
              </div>
            </div>

            <aside className="booking-summary-card">
              <div className="summary-title">
                <span>YOUR JOURNEY</span>
                <h2>Booking Summary</h2>
              </div>

              <div className="summary-route">
                <div className="summary-route-point">
                  <span className="route-circle start" />

                  <div>
                    <small>FROM</small>

                    <strong>
                      {availability.origin}
                    </strong>
                  </div>
                </div>

                <div className="vertical-route" />

                <div className="summary-route-point">
                  <span className="route-circle end" />

                  <div>
                    <small>TO</small>

                    <strong>
                      {availability.destination}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="summary-info-grid">
                <div>
                  <small>DATE</small>

                  <strong>
                    {formatDate(departure)}
                  </strong>
                </div>

                <div>
                  <small>DEPARTURE</small>

                  <strong>
                    {formatTime(departure)}
                  </strong>
                </div>

                <div>
                  <small>VEHICLE</small>

                  <strong>
                    {capitalize(
                      availability.vehicle.type
                    )}
                  </strong>
                </div>

                <div>
                  <small>PLATE</small>

                  <strong>
                    {availability.vehicle.plateNumber}
                  </strong>
                </div>
              </div>

              <div className="summary-divider" />

              <div className="selected-section">
                <div className="selected-title">
                  <span>SELECTED SEATS</span>

                  <strong>
                    {selectedSeats.length}
                  </strong>
                </div>

                {selectedSeats.length === 0 ? (
                  <div className="no-seat-selected">
                    <span>▦</span>
                    <p>No seats selected yet</p>
                  </div>
                ) : (
                  <div className="selected-seat-list">
                    {selectedSeats.map((seat) => (
                      <span key={seat}>
                        Seat {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="summary-divider" />

              <div className="fare-row">
                <span>
                  Fare × {selectedSeats.length}
                </span>

                <strong>
                  ฿{formatPrice(totalPrice)}
                </strong>
              </div>

              <div className="total-row">
                <span>Total</span>

                <strong>
                  ฿{formatPrice(totalPrice)}
                </strong>
              </div>

              <button
                className="continue-button"
                disabled={
                  selectedSeats.length === 0 ||
                  !availability.isBookingAllowed
                }
                onClick={continueBooking}
              >
                Continue
                <span>→</span>
              </button>

              <p className="summary-help">
                Select at least one available seat to continue.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Seat({
  number,
  booked,
  selected,
  disabled,
  onClick,
}: {
  number: number;
  booked: boolean;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  let className = "vehicle-seat";

  if (booked) {
    className += " booked";
  } else if (selected) {
    className += " selected";
  } else {
    className += " available";
  }

  return (
    <button
      className={className}
      disabled={booked || disabled}
      onClick={onClick}
    >
      <span className="seat-back" />
      <strong>{number}</strong>
    </button>
  );
}

function Step({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`booking-step ${
        active ? "active" : ""
      }`}
    >
      <span>{number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function Legend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="legend-item">
      <span
        className={`legend-box ${className}`}
      />

      {label}
    </div>
  );
}

function createSeatRows(
  capacity: number,
  vehicleType: "van" | "bus"
) {
  const seatsPerRow =
    vehicleType === "van" ? 3 : 4;

  const rows: {
    left: number[];
    right: number[];
  }[] = [];

  let seat = 1;

  while (seat <= capacity) {
    const rowSeats: number[] = [];

    for (
      let index = 0;
      index < seatsPerRow &&
      seat <= capacity;
      index++
    ) {
      rowSeats.push(seat);
      seat++;
    }

    if (vehicleType === "van") {
      rows.push({
        left: rowSeats.slice(0, 1),
        right: rowSeats.slice(1),
      });
    } else {
      rows.push({
        left: rowSeats.slice(0, 2),
        right: rowSeats.slice(2),
      });
    }
  }

  return rows;
}


function BusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 3h12a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2h-1v2a1 1 0 0 1-2 0v-2H8v2a1 1 0 0 1-2 0v-2H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v5h14V6a1 1 0 0 0-1-1H6Zm-.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}


function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number) {
  return Number(price || 0).toLocaleString();
}

function capitalize(value: string) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}