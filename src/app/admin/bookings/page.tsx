"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Filter, CheckCircle2, XCircle, Clock, Search, AlertCircle } from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = "/api/bookings";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }

      const res = await fetch(url, {
        headers: {
          "x-user-role": "administrator",
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "administrator",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update booking status");
      }

      setFeedback(`Booking #${bookingId.slice(-6)} updated to '${newStatus}'`);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || "Error updating booking");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            Admin Bookings Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor all reservations across scheduled trips and manage status updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={fetchBookings}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            Loading booking records...
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            No bookings found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Passenger</th>
                  <th className="px-6 py-4">Trip Route</th>
                  <th className="px-6 py-4">Departure</th>
                  <th className="px-6 py-4">Seats</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const trip = b.tripId;
                  const depDate = trip?.departureTime ? new Date(trip.departureTime) : null;

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{b._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {b.passengerName}
                        {b.userId?.email && (
                          <span className="block text-xs text-slate-400 font-normal">
                            {b.userId.email}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {trip ? `${trip.origin} → ${trip.destination}` : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {depDate
                          ? depDate.toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                          {Array.isArray(b.seatNumbers)
                            ? b.seatNumbers.sort((a: number, b: number) => a - b).join(", ")
                            : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            b.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "cancelled"
                              ? "bg-slate-200 text-slate-600"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status !== "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(b._id, "confirmed")}
                              disabled={updatingId === b._id}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => handleUpdateStatus(b._id, "cancelled")}
                              disabled={updatingId === b._id}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

