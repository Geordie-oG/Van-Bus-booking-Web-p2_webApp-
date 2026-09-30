"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Bus,
  Plus,
  Search,
  Filter,
  Edit2,
  XCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface Vehicle {
  _id: string;
  plateNumber: string;
  type: "van" | "bus";
  capacity: number;
  status: "active" | "inactive";
}

interface Trip {
  _id: string;
  origin: string;
  destination: string;
  departureTime: string;
  fare: number;
  status: "scheduled" | "departed" | "completed" | "cancelled";
  vehicleId: Vehicle | string;
  createdAt: string;
}

interface SeatAvailability {
  totalCapacity: number;
  bookedSeats: number[];
  availableSeats: number[];
  remainingCapacity: number;
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Schedule Trip Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [fare, setFare] = useState<number | "">(150);
  const [tripStatus, setTripStatus] = useState<"scheduled" | "departed" | "completed" | "cancelled">("scheduled");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Trip Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editVehicleId, setEditVehicleId] = useState("");
  const [editOrigin, setEditOrigin] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editDepartureTime, setEditDepartureTime] = useState("");
  const [editFare, setEditFare] = useState<number | "">(150);
  const [editStatus, setEditStatus] = useState<"scheduled" | "departed" | "completed" | "cancelled">("scheduled");
  const [editFormError, setEditFormError] = useState("");

  // Cancel Confirmation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingTrip, setCancellingTrip] = useState<Trip | null>(null);
  const [cancelError, setCancelError] = useState("");

  // Seat Availability Inspector Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [availabilityData, setAvailabilityData] = useState<SeatAvailability | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Load Trips and Active Vehicles
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [tripsRes, vehiclesRes] = await Promise.all([
        fetch("/api/trips?status=all"),
        fetch("/api/vehicles"),
      ]);

      const tripsJson = await tripsRes.json();
      const vehiclesJson = await vehiclesRes.json();

      if (tripsJson.success && Array.isArray(tripsJson.data)) {
        setTrips(tripsJson.data);
      }
      if (vehiclesJson.success && Array.isArray(vehiclesJson.data)) {
        setVehicles(vehiclesJson.data);
      }
    } catch (err: any) {
      showToast("Network error loading trip schedules", "error");
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeVehicles = vehicles.filter((v) => v.status === "active");

  // Filtered trips
  const filteredTrips = trips.filter((t) => {
    const routeText = `${t.origin} ${t.destination}`.toLowerCase();
    const matchesSearch = routeText.includes(searchTerm.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Trip stats
  const scheduledCount = trips.filter((t) => t.status === "scheduled").length;
  const completedCount = trips.filter((t) => t.status === "completed").length;
  const cancelledCount = trips.filter((t) => t.status === "cancelled").length;

  // Handle Schedule Trip Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!vehicleId) {
      setFormError("Please select an active vehicle from the fleet");
      return;
    }

    if (!origin.trim() || !destination.trim()) {
      setFormError("Origin and Destination are required");
      return;
    }

    if (!departureTime) {
      setFormError("Departure time is required");
      return;
    }

    const depDate = new Date(departureTime);
    if (isNaN(depDate.getTime())) {
      setFormError("Invalid departure time format");
      return;
    }

    if (fare === "" || Number(fare) < 0) {
      setFormError("Fare must be a positive number or zero");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          origin: origin.trim(),
          destination: destination.trim(),
          departureTime: depDate.toISOString(),
          fare: Number(fare),
          status: tripStatus,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast(
          `Trip ${json.data.origin} → ${json.data.destination} scheduled successfully!`,
          "success"
        );
        setScheduleModalOpen(false);
        setVehicleId("");
        setOrigin("");
        setDestination("");
        setDepartureTime("");
        setFare(150);
        setTripStatus("scheduled");
        loadData();
      } else {
        setFormError(json.error || "Failed to schedule trip");
      }
    } catch (err: any) {
      setFormError("Network error while creating trip");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    const vId = typeof trip.vehicleId === "object" ? trip.vehicleId._id : trip.vehicleId;
    setEditVehicleId(vId || "");
    setEditOrigin(trip.origin);
    setEditDestination(trip.destination);

    // Format ISO string to datetime-local format YYYY-MM-DDTHH:mm
    if (trip.departureTime) {
      const d = new Date(trip.departureTime);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      setEditDepartureTime(localISOTime);
    } else {
      setEditDepartureTime("");
    }

    setEditFare(trip.fare);
    setEditStatus(trip.status);
    setEditFormError("");
    setEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    setEditFormError("");

    if (!editVehicleId) {
      setEditFormError("Please select a vehicle");
      return;
    }

    if (!editOrigin.trim() || !editDestination.trim()) {
      setEditFormError("Origin and Destination are required");
      return;
    }

    const depDate = new Date(editDepartureTime);
    if (isNaN(depDate.getTime())) {
      setEditFormError("Invalid departure time format");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${editingTrip._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: editVehicleId,
          origin: editOrigin.trim(),
          destination: editDestination.trim(),
          departureTime: depDate.toISOString(),
          fare: Number(editFare),
          status: editStatus,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast("Trip details updated successfully!", "success");
        setEditModalOpen(false);
        loadData();
      } else {
        setEditFormError(json.error || "Failed to update trip");
      }
    } catch (err: any) {
      setEditFormError("Network error while updating trip");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Cancel Modal
  const openCancelConfirm = (trip: Trip) => {
    setCancellingTrip(trip);
    setCancelError("");
    setCancelModalOpen(true);
  };

  // Execute Cancel Trip
  const handleCancelTrip = async () => {
    if (!cancellingTrip) return;
    setCancelError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/trips/${cancellingTrip._id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast(
          `Trip ${cancellingTrip.origin} → ${cancellingTrip.destination} cancelled. All seats released.`,
          "success"
        );
        setCancelModalOpen(false);
        loadData();
      } else {
        setCancelError(json.error || "Failed to cancel trip");
      }
    } catch (err: any) {
      setCancelError("Network error while cancelling trip");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Seat Availability Inspector Modal
  const openSeatInspector = async (trip: Trip) => {
    setInspectingTrip(trip);
    setAvailabilityData(null);
    setInspectLoading(true);
    setInspectModalOpen(true);

    try {
      const res = await fetch(`/api/trips/${trip._id}/availability`);
      const json = await res.json();
      if (json.success && json.data) {
        setAvailabilityData({
          totalCapacity: json.data.totalCapacity,
          bookedSeats: json.data.bookedSeats || [],
          availableSeats: json.data.availableSeats || [],
          remainingCapacity: json.data.remainingCapacity || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching seat availability:", err);
    } finally {
      setInspectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
              toastMessage.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 hover:opacity-75 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Trip Schedules Management
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-700">
              Module 1B
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Schedule route departures, link fleet vehicles, manage seat fares, and oversee trip lifecycles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium shadow-sm transition disabled:opacity-50"
            title="Refresh schedules"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setFormError("");
              if (activeVehicles.length > 0) {
                setVehicleId(activeVehicles[0]._id);
              }
              setScheduleModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Trip</span>
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Upcoming Scheduled</p>
            <p className="text-xl font-bold text-blue-600">{scheduledCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Completed Trips</p>
            <p className="text-xl font-bold text-emerald-600">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Cancelled Trips</p>
            <p className="text-xl font-bold text-rose-600">{cancelledCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Schedules</p>
            <p className="text-xl font-bold text-slate-900">{trips.length}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Route search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by route origin or destination (e.g. Bangkok, Pattaya)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto py-2 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled Only</option>
            <option value="departed">Departed Only</option>
            <option value="completed">Completed Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>
        </div>
      </div>

      {/* Trips Timetable Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-sm">Loading trip schedules...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No trip schedules found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || statusFilter !== "all"
                ? "No trips matched your filter criteria."
                : "No trips scheduled yet. Click 'Schedule Trip' to create your first route departure."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Route</th>
                  <th className="py-3 px-4">Departure Time</th>
                  <th className="py-3 px-4">Assigned Vehicle</th>
                  <th className="py-3 px-4">Fare</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTrips.map((trip) => {
                  const vehicleObj =
                    typeof trip.vehicleId === "object" ? (trip.vehicleId as Vehicle) : null;
                  const isScheduled = trip.status === "scheduled";
                  const isCancelled = trip.status === "cancelled";
                  const depDate = new Date(trip.departureTime);

                  return (
                    <tr key={trip._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Route */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <span>{trip.origin}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span>{trip.destination}</span>
                          </div>
                        </div>
                      </td>

                      {/* Departure Date/Time */}
                      <td className="py-4 px-4">
                        <div className="text-slate-800 font-medium">
                          {depDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {depDate.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Assigned Vehicle */}
                      <td className="py-4 px-4">
                        {vehicleObj ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {vehicleObj.plateNumber}
                            </span>
                            <div className="text-xs text-slate-500 flex items-center space-x-1 capitalize">
                              <Bus className="w-3 h-3 text-slate-400" />
                              <span>
                                {vehicleObj.type} · {vehicleObj.capacity} seats
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">
                            ID: {String(trip.vehicleId).slice(-6)}
                          </span>
                        )}
                      </td>

                      {/* Fare */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-0.5 text-emerald-600 font-mono">
                          <span>฿{Number(trip.fare).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            trip.status === "scheduled"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : trip.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : trip.status === "departed"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200 line-through"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              trip.status === "scheduled"
                                ? "bg-blue-500 animate-pulse"
                                : trip.status === "completed"
                                ? "bg-emerald-500"
                                : trip.status === "departed"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          <span>{trip.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right space-x-1">
                        {/* Seat Occupancy Quick-Inspector */}
                        <button
                          onClick={() => openSeatInspector(trip)}
                          className="inline-flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition"
                          title="Inspect live seat occupancy"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden lg:inline">Seats</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(trip)}
                          className="inline-flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
                          title="Edit trip details"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden lg:inline">Edit</span>
                        </button>

                        {/* Cancel Button */}
                        {isScheduled && (
                          <button
                            onClick={() => openCancelConfirm(trip)}
                            className="inline-flex items-center space-x-1 text-xs font-medium text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition"
                            title="Cancel trip and release all seats"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="hidden lg:inline">Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SCHEDULE TRIP MODAL                                      */}
      {/* ======================================================== */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Schedule New Trip</h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-4">
              {/* Vehicle selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Assign Fleet Vehicle (Active Only) <span className="text-rose-500">*</span>
                </label>
                {activeVehicles.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center justify-between">
                    <span>No active vehicles available in fleet!</span>
                    <Link
                      href="/admin/vehicles"
                      className="font-bold underline text-amber-900 ml-2"
                    >
                      Register a vehicle first
                    </Link>
                  </div>
                ) : (
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {activeVehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.plateNumber} — {v.type.toUpperCase()} ({v.capacity} passenger seats)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Origin and Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Origin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangkok (Mo Chit)"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Destination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pattaya Terminal"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Departure Date/Time and Fare */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Departure Date &amp; Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Seat Fare (฿ THB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={fare}
                    onChange={(e) => setFare(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Trip Status
                </label>
                <select
                  value={tripStatus}
                  onChange={(e) => setTripStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="scheduled">Scheduled (Open for customer booking)</option>
                  <option value="departed">Departed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || activeVehicles.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow transition disabled:opacity-50"
                >
                  {submitting ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT TRIP MODAL                                          */}
      {/* ======================================================== */}
      {editModalOpen && editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Trip: {editingTrip.origin} → {editingTrip.destination}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Assigned Fleet Vehicle <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editVehicleId}
                  onChange={(e) => setEditVehicleId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.plateNumber} — {v.type.toUpperCase()} ({v.capacity} seats) -{" "}
                      {v.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Origin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Destination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Departure Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editDepartureTime}
                    onChange={(e) => setEditDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Fare (฿ THB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={editFare}
                    onChange={(e) => setEditFare(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Trip Lifecycle Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="departed">Departed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled (Releases all booked seats)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CANCEL TRIP CONFIRMATION MODAL                           */}
      {/* ======================================================== */}
      {cancelModalOpen && cancellingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cancel Scheduled Trip</h3>
                <p className="text-xs text-slate-500">
                  {cancellingTrip.origin} → {cancellingTrip.destination}
                </p>
              </div>
            </div>

            {cancelError ? (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{cancelError}</span>
              </div>
            ) : (
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to cancel this scheduled trip?
                <br />
                <strong className="text-rose-600 font-semibold block mt-2">
                  Important: All existing customer bookings for this trip will be cancelled immediately and their reserved seats will be released.
                </strong>
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Keep Trip
              </button>
              <button
                type="button"
                onClick={handleCancelTrip}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow transition disabled:opacity-50"
              >
                {submitting ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SEAT AVAILABILITY INSPECTOR MODAL                        */}
      {/* ======================================================== */}
      {inspectModalOpen && inspectingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Seat Occupancy &amp; Availability
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectingTrip.origin} → {inspectingTrip.destination}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              {inspectLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs">Querying availability endpoint...</p>
                </div>
              ) : availabilityData ? (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase">Capacity</p>
                      <p className="text-lg font-bold text-slate-900">
                        {availabilityData.totalCapacity}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <p className="text-xs text-rose-600 uppercase">Booked</p>
                      <p className="text-lg font-bold text-rose-600">
                        {availabilityData.bookedSeats.length}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-xs text-emerald-600 uppercase">Available</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {availabilityData.remainingCapacity}
                      </p>
                    </div>
                  </div>

                  {/* Seat Grid Map */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-semibold uppercase tracking-wider">
                        Cabin Seat Layout
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                          <span>Free</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                          <span>Reserved</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {Array.from({ length: availabilityData.totalCapacity }, (_, i) => i + 1).map(
                          (seatNum) => {
                            const isBooked = availabilityData.bookedSeats.includes(seatNum);
                            return (
                              <div
                                key={seatNum}
                                className={`h-10 rounded-lg flex flex-col items-center justify-center font-mono text-xs font-bold transition ${
                                  isBooked
                                    ? "bg-rose-500 text-white shadow-sm"
                                    : "bg-white text-slate-700 border border-slate-300 hover:border-emerald-500"
                                }`}
                              >
                                <span>{seatNum}</span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Failed to load seat availability for this trip.
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
