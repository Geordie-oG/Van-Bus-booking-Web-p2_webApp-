"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, Calendar, Plus, ArrowRight, ShieldCheck, CheckCircle2, Clock } from "lucide-react";

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
}

export default function AdminDashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [vehiclesRes, tripsRes] = await Promise.all([
          fetch("/api/vehicles").then((r) => r.json()),
          fetch("/api/trips?status=all").then((r) => r.json()),
        ]);

        if (vehiclesRes.success && Array.isArray(vehiclesRes.data)) {
          setVehicles(vehiclesRes.data);
        }
        if (tripsRes.success && Array.isArray(tripsRes.data)) {
          setTrips(tripsRes.data);
        }
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const scheduledTrips = trips.filter((t) => t.status === "scheduled").length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Transport Administration Control Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Vehicle &amp; Trip Management
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
              Manage your transport fleet capacity, vehicle statuses, and route schedules.
              Your data powers live seat availability and customer booking workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/vehicles"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </Link>
            <Link
              href="/admin/trips"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Trip</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Fleet
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : vehicles.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {loading ? "" : `${activeVehicles} active in service`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Vehicles
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {loading ? "..." : activeVehicles}
            </p>
            <p className="text-xs text-slate-500 mt-1">Ready for scheduling</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Scheduled Trips
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {loading ? "..." : scheduledTrips}
            </p>
            <p className="text-xs text-slate-500 mt-1">Upcoming departures</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Recorded Trips
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? "..." : trips.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">History &amp; active schedules</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicles Section Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bus className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Module 1A
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Vehicles Fleet Management
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Register vans and buses, assign passenger seating capacities, configure vehicle types,
            and monitor active service availability.
          </p>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              API: <code>/api/vehicles</code>
            </span>
            <Link
              href="/admin/vehicles"
              className="inline-flex items-center space-x-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 group"
            >
              <span>Manage Fleet</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Trips Section Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Module 1B
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Trips &amp; Schedules Management
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Schedule route departures, link active fleet vehicles, configure fares, and manage
            trip lifecycles (scheduled, departed, completed, or cancelled).
          </p>
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              API: <code>/api/trips</code>
            </span>
            <Link
              href="/admin/trips"
              className="inline-flex items-center space-x-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 group"
            >
              <span>Manage Schedules</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
