"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, MapPin, Bus, RefreshCw, CheckCircle2, Ticket } from "lucide-react";

export default function PassengerManifestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;

  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripRes, bookingsRes] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/bookings?tripId=${tripId}&status=confirmed`),
      ]);

      const tripData = await tripRes.json();
      const bookingsData = await bookingsRes.json();

      if (tripData.success) setTrip(tripData.data);
      if (bookingsData.success) setBookings(bookingsData.data || []);
    } catch (err) {
      console.error("Error loading manifest:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) fetchData();
  }, [tripId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading passenger manifest...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-12 text-center text-slate-600">
        Trip not found.
      </div>
    );
  }

  const departureDate = new Date(trip.departureTime);
  const totalBookedSeats = bookings.reduce((sum, b) => sum + (b.seatNumbers?.length || 0), 0);
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.seatNumbers?.length || 0) * trip.fare, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Trips
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-emerald-600" />
              Passenger Manifest / Driver Sheet
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Detailed passenger roster and seat allocation for this scheduled departure.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh Roster
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs uppercase font-medium text-slate-400">Route & Vehicle</span>
          <div className="text-base font-bold text-slate-900 mt-1">
            {trip.origin} → {trip.destination}
          </div>
          <div className="text-xs text-slate-500 mt-1 uppercase font-semibold">
            {trip.vehicleId?.type} ({trip.vehicleId?.plateNumber})
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs uppercase font-medium text-slate-400">Departure</span>
          <div className="text-base font-bold text-slate-900 mt-1">
            {departureDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at{" "}
            {departureDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Status: {trip.status}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs uppercase font-medium text-slate-400">Occupancy & Revenue</span>
          <div className="text-base font-bold text-slate-900 mt-1">
            {totalBookedSeats} / {trip.vehicleId?.capacity || 14} Seats Booked
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total Collection: <strong className="text-emerald-700">${totalRevenue.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Manifest Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Confirmed Passengers ({bookings.length} reservations)</h3>
          <span className="text-xs text-slate-500">Sorted by seat numbers</span>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No confirmed bookings yet</p>
            <p className="text-xs text-slate-400 mt-1">Seats are currently vacant for booking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Seat Numbers</th>
                  <th className="px-6 py-4">Passenger Name</th>
                  <th className="px-6 py-4">Customer Email</th>
                  <th className="px-6 py-4">Booking Ref</th>
                  <th className="px-6 py-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs">
                        Seats {b.seatNumbers.sort((x: number, y: number) => x - y).join(", ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {b.passengerName}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {b.userId?.email || "walk-in@booking.com"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      #{b._id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      ${(trip.fare * (b.seatNumbers?.length || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

