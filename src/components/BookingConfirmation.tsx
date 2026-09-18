"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Ticket, Calendar, MapPin, Bus, User, ArrowRight } from "lucide-react";

interface BookingConfirmationProps {
  booking: {
    _id: string;
    passengerName: string;
    seatNumbers: number[];
    status: string;
    createdAt: string;
    tripId: {
      _id: string;
      origin: string;
      destination: string;
      departureTime: string;
      fare: number;
      vehicleId?: {
        plateNumber: string;
        type: string;
      };
    };
  };
  onBookAnother?: () => void;
}

export default function BookingConfirmation({
  booking,
  onBookAnother,
}: BookingConfirmationProps) {
  const trip = booking.tripId;
  const departureDate = new Date(trip.departureTime);
  const totalAmount = trip.fare * booking.seatNumbers.length;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-3.5 shadow-inner">
          <CheckCircle2 className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Booking Confirmed!</h2>
        <p className="text-emerald-100 text-sm mt-1">
          Your reservation has been securely saved in the system.
        </p>
      </div>

      {/* Ticket Body */}
      <div className="p-8 space-y-6">
        {/* Reference & Status */}
        <div className="flex items-center justify-between pb-5 border-b border-dashed border-slate-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Booking Reference
            </span>
            <div className="font-mono text-sm font-bold text-slate-800">
              #{booking._id}
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            {booking.status}
          </span>
        </div>

        {/* Route Details */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs uppercase font-medium text-slate-400">Route</span>
              <div className="text-base font-bold text-slate-900">
                {trip.origin} <span className="text-slate-400 font-normal">→</span> {trip.destination}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-[11px] uppercase font-medium text-slate-400 block">Departure</span>
                <span className="text-xs font-semibold text-slate-800">
                  {departureDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  {departureDate.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Bus className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-[11px] uppercase font-medium text-slate-400 block">Vehicle</span>
                <span className="text-xs font-semibold text-slate-800 uppercase">
                  {trip.vehicleId?.type || "Van"} ({trip.vehicleId?.plateNumber || "N/A"})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger & Seats Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Passenger
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {booking.passengerName}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Ticket className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reserved Seats
              </span>
            </div>
            <div className="text-sm font-bold text-emerald-700">
              Seat {booking.seatNumbers.sort((a, b) => a - b).join(", ")}
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex items-center justify-between px-2 pt-1 text-sm">
          <span className="font-semibold text-slate-600">Total Amount:</span>
          <span className="text-xl font-extrabold text-slate-900">
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Policy Notice */}
        <p className="text-xs text-slate-400 text-center italic bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-100">
          Tip: You can review or cancel this booking before the departure time on your "My Bookings" page.
        </p>

        {/* Navigation Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/my-bookings"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm text-center transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>View in My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          {onBookAnother && (
            <button
              onClick={onBookAnother}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Book Another Seat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

