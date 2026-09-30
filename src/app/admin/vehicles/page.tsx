"use client";

import { useEffect, useState } from "react";
import {
  Bus,
  Plus,
  Search,
  Filter,
  Edit2,
  Power,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
} from "lucide-react";

interface Vehicle {
  _id: string;
  plateNumber: string;
  type: "van" | "bus";
  capacity: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "van" | "bus">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Add Vehicle Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [type, setType] = useState<"van" | "bus">("van");
  const [capacity, setCapacity] = useState<number | "">(14);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Vehicle Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editType, setEditType] = useState<"van" | "bus">("van");
  const [editCapacity, setEditCapacity] = useState<number | "">(14);
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [editFormError, setEditFormError] = useState("");

  // Status Action (Deactivate/Reactivate) Confirmation Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetVehicle, setTargetVehicle] = useState<Vehicle | null>(null);
  const [statusActionError, setStatusActionError] = useState("");

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

  // Fetch vehicles list from /api/vehicles
  const loadVehicles = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/vehicles");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setVehicles(json.data);
      } else {
        showToast(json.error || "Failed to load vehicles", "error");
      }
    } catch (err: any) {
      showToast("Network error connecting to vehicle service", "error");
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.plateNumber
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Fleet Statistics
  const totalFleet = vehicles.length;
  const activeFleet = vehicles.filter((v) => v.status === "active").length;
  const totalSeats = vehicles.reduce((sum, v) => sum + (v.status === "active" ? v.capacity : 0), 0);

  // Handle Add Vehicle Form Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!plateNumber.trim()) {
      setFormError("Plate number is required");
      return;
    }

    if (!capacity || Number(capacity) <= 0) {
      setFormError("Capacity must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: plateNumber.trim().toUpperCase(),
          type,
          capacity: Number(capacity),
          status,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast(`Vehicle ${json.data.plateNumber} added successfully!`, "success");
        setAddModalOpen(false);
        setPlateNumber("");
        setType("van");
        setCapacity(14);
        setStatus("active");
        loadVehicles();
      } else {
        setFormError(json.error || "Failed to add vehicle");
      }
    } catch (err: any) {
      setFormError("Network error while creating vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditPlateNumber(vehicle.plateNumber);
    setEditType(vehicle.type);
    setEditCapacity(vehicle.capacity);
    setEditStatus(vehicle.status);
    setEditFormError("");
    setEditModalOpen(true);
  };

  // Handle Edit Vehicle Form Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setEditFormError("");

    if (!editPlateNumber.trim()) {
      setEditFormError("Plate number is required");
      return;
    }

    if (!editCapacity || Number(editCapacity) <= 0) {
      setEditFormError("Capacity must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${editingVehicle._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plateNumber: editPlateNumber.trim().toUpperCase(),
          type: editType,
          capacity: Number(editCapacity),
          status: editStatus,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        showToast(`Vehicle ${json.data.plateNumber} updated successfully!`, "success");
        setEditModalOpen(false);
        loadVehicles();
      } else {
        setEditFormError(json.error || "Failed to update vehicle");
      }
    } catch (err: any) {
      setEditFormError("Network error while updating vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Status Confirmation Modal (Toggle Active / Inactive)
  const openStatusConfirm = (vehicle: Vehicle) => {
    setTargetVehicle(vehicle);
    setStatusActionError("");
    setStatusModalOpen(true);
  };

  // Execute Deactivation or Reactivation
  const handleToggleStatus = async () => {
    if (!targetVehicle) return;
    setStatusActionError("");
    setSubmitting(true);

    try {
      if (targetVehicle.status === "active") {
        // Deactivate using DELETE /api/vehicles/:id (soft delete with upcoming trips guard)
        const res = await fetch(`/api/vehicles/${targetVehicle._id}`, {
          method: "DELETE",
        });
        const json = await res.json();

        if (res.ok && json.success) {
          showToast(`Vehicle ${targetVehicle.plateNumber} deactivated`, "success");
          setStatusModalOpen(false);
          loadVehicles();
        } else {
          setStatusActionError(json.error || "Failed to deactivate vehicle");
        }
      } else {
        // Reactivate using PATCH /api/vehicles/:id
        const res = await fetch(`/api/vehicles/${targetVehicle._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        });
        const json = await res.json();

        if (res.ok && json.success) {
          showToast(`Vehicle ${targetVehicle.plateNumber} reactivated to active service!`, "success");
          setStatusModalOpen(false);
          loadVehicles();
        } else {
          setStatusActionError(json.error || "Failed to reactivate vehicle");
        }
      }
    } catch (err: any) {
      setStatusActionError("Network error modifying vehicle status");
    } finally {
      setSubmitting(false);
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

      {/* Page Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Fleet Vehicles Management
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700">
              Module 1A
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Register and control transport vehicles, seat capacities, and fleet availability.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadVehicles(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium shadow-sm transition disabled:opacity-50"
            title="Refresh fleet data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setFormError("");
              setAddModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Fleet Stats Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Total Fleet</p>
            <p className="text-xl font-bold text-slate-900">{totalFleet}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Active Vehicles</p>
            <p className="text-xl font-bold text-emerald-600">{activeFleet}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Active Seating Capacity</p>
            <p className="text-xl font-bold text-indigo-600">{totalSeats} seats</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by license plate (e.g. VAN-101)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full md:w-auto py-2 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="van">Vans Only</option>
            <option value="bus">Buses Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full md:w-auto py-2 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Fleet Vehicles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-sm">Loading vehicle fleet from database...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Bus className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No vehicles found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "No vehicles matched your filter parameters. Try clearing your filters."
                : "No vehicles in the database yet. Click 'Add Vehicle' to register your first transport."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Plate Number</th>
                  <th className="py-3 px-4">Vehicle Type</th>
                  <th className="py-3 px-4">Passenger Capacity</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4 hidden md:table-cell">Registered Date</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredVehicles.map((vehicle) => {
                  const isActive = vehicle.status === "active";
                  return (
                    <tr
                      key={vehicle._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Plate Number */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="inline-flex items-center space-x-2 font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md border border-slate-300 shadow-inner">
                          <span>{vehicle.plateNumber}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            vehicle.type === "van"
                              ? "bg-sky-100 text-sky-800 border border-sky-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          <Bus className="w-3.5 h-3.5" />
                          <span>{vehicle.type}</span>
                        </span>
                      </td>

                      {/* Capacity */}
                      <td className="py-4 px-4 font-medium text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{vehicle.capacity} seats</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span className="capitalize">{vehicle.status}</span>
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="py-4 px-4 text-slate-500 hidden md:table-cell">
                        {vehicle.createdAt
                          ? new Date(vehicle.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="inline-flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition"
                          title="Edit vehicle details"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => openStatusConfirm(vehicle)}
                          className={`inline-flex items-center space-x-1 text-xs font-medium p-1.5 rounded-lg transition ${
                            isActive
                              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={isActive ? "Deactivate vehicle" : "Reactivate vehicle"}
                        >
                          <Power className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {isActive ? "Deactivate" : "Activate"}
                          </span>
                        </button>
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
      {/* ADD VEHICLE MODAL                                        */}
      {/* ======================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Add New Vehicle</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
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

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  License Plate Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAN-303 or 1-AB-1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Must be unique across all vehicles</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Seat Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">Positive integer &gt; 0</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="active">Active (Available for scheduling)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT VEHICLE MODAL                                       */}
      {/* ======================================================== */}
      {editModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Vehicle: {editingVehicle.plateNumber}
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
                  License Plate Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPlateNumber}
                  onChange={(e) => setEditPlateNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="van">Van</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Seat Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editCapacity}
                    onChange={(e) =>
                      setEditCapacity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Operational Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
      {/* STATUS TOGGLE CONFIRMATION MODAL                         */}
      {/* ======================================================== */}
      {statusModalOpen && targetVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  targetVehicle.status === "active"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {targetVehicle.status === "active"
                    ? "Deactivate Vehicle"
                    : "Reactivate Vehicle"}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {targetVehicle.plateNumber} ({targetVehicle.type.toUpperCase()})
                </p>
              </div>
            </div>

            {statusActionError ? (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{statusActionError}</span>
              </div>
            ) : (
              <p className="text-sm text-slate-600 mb-6">
                {targetVehicle.status === "active"
                  ? "Are you sure you want to deactivate this vehicle? Inactive vehicles cannot be assigned to new scheduled trips. Note: Deactivation will be rejected if this vehicle is assigned to upcoming scheduled trips."
                  : "Are you sure you want to reactivate this vehicle? Once active, it can be assigned to new trips."}
              </p>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow transition disabled:opacity-50 ${
                  targetVehicle.status === "active"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {submitting
                  ? "Processing..."
                  : targetVehicle.status === "active"
                  ? "Confirm Deactivation"
                  : "Confirm Activation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
