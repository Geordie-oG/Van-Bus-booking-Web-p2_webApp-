"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, RefreshCw, AlertCircle, CheckCircle2, Users, MapPin, XCircle, ArrowRight } from "lucide-react";

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [fare, setFare] = useState<number>(15);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, vehiclesRes] = await Promise.all([
        fetch("/api/trips?status=all"),
        fetch("/api/vehicles"),
      ]);

      const tripsData = await tripsRes.json();
      const vehiclesData = await vehiclesRes.json();

      if (tripsData.success) setTrips(tripsData.data || []);
      if (vehiclesData.success) {
        const activeOnly = (vehiclesData.data || []).filter((v: any) => v.status === "active");
        setVehicles(activeOnly);
        if (activeOnly.length > 0 && !vehicleId) {
          setVehicleId(activeOnly[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load admin trips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (!vehicleId) throw new Error("Please select an active vehicle");
      if (!departureTime) throw new Error("Please specify departure date and time");

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          origin,
          destination,
          departureTime: new Date(departureTime).toISOString(),
          fare: Number(fare),
          status: "scheduled",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule trip");
      }

      setFeedback({
        type: "success",
        message: `Trip scheduled: ${data.data.origin} → ${data.data.destination}`,
      });
      setShowAddModal(false);
      setOrigin("");
      setDestination("");
      setDepartureTime("");
      fetchData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to cancel this trip? All reservations for this trip will be cancelled.")) {
      return;
    }

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "Trip and its bookings cancelled successfully" });
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-1">
            Member 1 Deliverable — Li Hout Van
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-8 h-8 text-emerald-600" />
            Trip Scheduling & Dispatch
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Publish routes, assign active fleet vehicles, and monitor passenger manifests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Trip</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Trips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            Loading trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No trips scheduled yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Schedule New Trip" to publish your first departure.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Departure Time</th>
                  <th className="px-6 py-4">Assigned Vehicle</th>
                  <th className="px-6 py-4">Fare</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((t) => {
                  const depDate = new Date(t.departureTime);
                  const isPast = depDate <= new Date();

                  return (
                    <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {t.origin} → {t.destination}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {depDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        {depDate.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-bold text-slate-800 uppercase">
                          {t.vehicleId?.plateNumber || "N/A"}
                        </span>{" "}
                        <span className="text-slate-400">({t.vehicleId?.capacity} Seats)</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        ${t.fare.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            t.status === "scheduled"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/trips/${t._id}/manifest`}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>Manifest</span>
                          </Link>
                          {t.status === "scheduled" && (
                            <button
                              onClick={() => handleCancelTrip(t._id)}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                            >
                              Cancel Trip
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

      {/* Schedule Trip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Schedule New Transport Trip</h3>
            <form onSubmit={handleScheduleTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Assign Vehicle *
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.plateNumber} ({v.type.toUpperCase()} - {v.capacity} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Origin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangkok"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pattaya"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Departure Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Fare per Seat ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.5}
                    value={fare}
                    onChange={(e) => setFare(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                >
                  {submitting ? "Scheduling..." : "Publish Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

