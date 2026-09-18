"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import SeatSelector from "@/components/SeatSelector";
import BookingForm from "@/components/BookingForm";
import BookingConfirmation from "@/components/BookingConfirmation";

export default function BookTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;

  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/trips/${tripId}/availability`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load seat availability");
      }

      setAvailability(data.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading availability.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchAvailability();
    }
  }, [tripId]);

  const handleToggleSeat = (seatNumber: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Checking live seat availability...</p>
      </div>
    );
  }

  if (error || !availability) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-800">Could Not Load Trip</h2>
          <p className="text-sm text-rose-600 mt-1">{error || "Trip information unavailable."}</p>
          <div className="mt-5">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (confirmedBooking) {
    return (
      <div className="py-6">
        <BookingConfirmation
          booking={confirmedBooking}
          onBookAnother={() => {
            setConfirmedBooking(null);
            setSelectedSeats([]);
            fetchAvailability();
          }}
        />
      </div>
    );
  }

  const departureDate = new Date(availability.departureTime);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back button and page title */}
      <div>
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Trip List
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Reserve Seats
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Select your preferred seats on the vehicle diagram and confirm your booking.
            </p>
          </div>
          <button
            onClick={fetchAvailability}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh Availability
          </button>
        </div>
      </div>

      {/* Trip Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Route</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {availability.origin} → {availability.destination}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Departure</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {departureDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <span className="text-xs text-slate-500">
                {departureDate.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Availability</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {availability.remainingCapacity} of {availability.totalCapacity} seats left
              </div>
              <span className="text-xs text-slate-500">
                Vehicle: {availability.vehicle?.plateNumber}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Fare per Seat</span>
              <div className="text-sm font-bold text-emerald-600 mt-0.5">
                ${availability.fare || 15}
              </div>
              <span className="text-xs text-slate-500">Fixed rate</span>
            </div>
          </div>
        </div>

        {!availability.isBookingAllowed && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              Reservations are closed for this trip because it has departed or is no longer scheduled.
            </span>
          </div>
        )}
      </div>

      {/* Main Booking Workspace: Seat Selection & Form */}
      {availability.isBookingAllowed ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SeatSelector
              totalCapacity={availability.totalCapacity}
              vehicleType={availability.vehicle?.type}
              bookedSeats={availability.bookedSeats}
              selectedSeats={selectedSeats}
              onToggleSeat={handleToggleSeat}
            />
          </div>

          <div>
            <BookingForm
              tripId={tripId}
              fare={availability.fare || 15}
              selectedSeats={selectedSeats}
              onBookingSuccess={(booking) => setConfirmedBooking(booking)}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md transition-all"
          >
            Find Another Scheduled Trip
          </Link>
        </div>
      )}
    </div>
  );
}

