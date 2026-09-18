"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Calendar, MapPin, Bus, User, AlertCircle, Trash2, CheckCircle2, ArrowRight, RefreshCw, XCircle } from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings", {
        headers: {
          "x-user-role": "customer",
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? The reserved seats will be released.")) {
      return;
    }

    setCancellingId(bookingId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "customer",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel booking.");
      }

      setFeedback({
        type: "success",
        message: "Booking cancelled successfully. Your seats have been released for others.",
      });

      fetchMyBookings();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to cancel booking.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-8 h-8 text-emerald-600" />
            My Bookings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review your reservation details, seat numbers, or cancel bookings before departure.
          </p>
        </div>

        <button
          onClick={fetchMyBookings}
          className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{feedback.message}</div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          Loading your reservations...
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Reservations Yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            You don't have any bookings saved. Browse scheduled trips and reserve your seats today!
          </p>
          <div className="mt-6">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md transition-all"
            >
              <span>Explore Available Trips</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const trip = booking.tripId;
            const departureDate = trip?.departureTime ? new Date(trip.departureTime) : null;
            const isDeparted = departureDate ? departureDate <= new Date() : false;
            const isCancelled = booking.status === "cancelled";
            const canCancel = !isCancelled && !isDeparted;

            return (
              <div
                key={booking._id}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md ${
                  isCancelled
                    ? "border-slate-200 opacity-70 bg-slate-50/50"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{booking._id.slice(-8)}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : booking.status === "cancelled"
                          ? "bg-slate-200 text-slate-600 border border-slate-300"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Booked on: {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Route */}
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-[11px] uppercase font-medium text-slate-400 block">Route</span>
                      <span className="text-sm font-bold text-slate-900">
                        {trip ? `${trip.origin} → ${trip.destination}` : "Unknown Route"}
                      </span>
                    </div>
                  </div>

                  {/* Departure */}
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-[11px] uppercase font-medium text-slate-400 block">Departure</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {departureDate
                          ? departureDate.toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </span>
                      {isDeparted && !isCancelled && (
                        <span className="text-[10px] text-amber-700 font-semibold block">
                          Departed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Passenger & Seats */}
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-[11px] uppercase font-medium text-slate-400 block">Passenger</span>
                      <span className="text-sm font-medium text-slate-800">
                        {booking.passengerName}
                      </span>
                    </div>
                  </div>

                  {/* Reserved Seats */}
                  <div className="flex items-start gap-2.5">
                    <Ticket className="w-4 h-4 text-teal-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-[11px] uppercase font-medium text-slate-400 block">Seat(s)</span>
                      <span className="text-sm font-bold text-emerald-700">
                        {Array.isArray(booking.seatNumbers)
                          ? booking.seatNumbers.sort((a: number, b: number) => a - b).join(", ")
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {trip && (
                      <span>
                        Total: <strong>${(trip.fare * (booking.seatNumbers?.length || 1)).toFixed(2)}</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    {canCancel && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{cancellingId === booking._id ? "Cancelling..." : "Cancel Booking"}</span>
                      </button>
                    )}
                    {isCancelled && (
                      <span className="text-xs text-slate-400 italic">Seats released</span>
                    )}
                    {!isCancelled && isDeparted && (
                      <span className="text-xs text-slate-400 italic">Trip completed / Non-cancellable</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

