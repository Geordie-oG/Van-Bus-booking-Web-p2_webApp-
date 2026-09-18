"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, Calendar, MapPin, DollarSign, Users, ArrowRight, Search, RefreshCw } from "lucide-react";

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOrigin, setSearchOrigin] = useState("");
  const [searchDestination, setSearchDestination] = useState("");

  const fetchTrips = async () => {
    try {
      setLoading(true);
      let url = "/api/trips?status=scheduled";
      if (searchOrigin) url += `&origin=${encodeURIComponent(searchOrigin)}`;
      if (searchDestination) url += `&destination=${encodeURIComponent(searchDestination)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setTrips(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load trips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Scheduled Trips & Routes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse upcoming van and bus departures, check live seat availability, and book online.
          </p>
        </div>

        <button
          onClick={fetchTrips}
          className="self-start md:self-auto flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTrips();
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Origin (e.g. Bangkok)"
              value={searchOrigin}
              onChange={(e) => setSearchOrigin(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Destination (e.g. Pattaya)"
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Search className="w-4 h-4" />
            Search Routes
          </button>
        </form>
      </div>

      {/* Trip Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          Loading scheduled trips...
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <Bus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Trips Found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            No scheduled departures match your search criteria. Try clearing the search filters or seed demo trips.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const departureDate = new Date(trip.departureTime);
            const vehicle = trip.vehicleId;

            return (
              <div
                key={trip._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {vehicle?.type || "Van"}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      Plate: {vehicle?.plateNumber || "N/A"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>{trip.origin}</span>
                      <span className="text-slate-400 font-normal">→</span>
                      <span>{trip.destination}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {departureDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at{" "}
                        {departureDate.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Total Capacity: {vehicle?.capacity || 14} seats</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-slate-400 block">
                      Fare
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${trip.fare.toFixed(2)}
                    </span>
                  </div>

                  <Link
                    href={`/trips/${trip._id}/book`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Select Seats</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

