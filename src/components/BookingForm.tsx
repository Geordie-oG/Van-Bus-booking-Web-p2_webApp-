"use client";

import React, { useState } from "react";
import { User, DollarSign, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface BookingFormProps {
  tripId: string;
  fare: number;
  selectedSeats: number[];
  onBookingSuccess: (bookingData: any) => void;
  userId?: string;
}

export default function BookingForm({
  tripId,
  fare,
  selectedSeats,
  onBookingSuccess,
  userId = "670f1a2b3c4d5e6f7a8b9c0d", // Default mock customer ID if not logged in
}: BookingFormProps) {
  const [passengerName, setPassengerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalFare = fare * selectedSeats.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedSeats.length === 0) {
      setErrorMessage("Please select at least one seat before submitting.");
      return;
    }

    if (!passengerName.trim()) {
      setErrorMessage("Passenger full name is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-role": "customer",
        },
        body: JSON.stringify({
          tripId,
          userId,
          seatNumbers: selectedSeats,
          passengerName: passengerName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to confirm booking.");
      }

      onBookingSuccess(result.data);
    } catch (err: any) {
      console.error("Booking error:", err);
      setErrorMessage(err.message || "An unexpected error occurred while booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="font-semibold text-slate-800 text-lg pb-4 border-b border-slate-100">
        Passenger Details & Payment Summary
      </h3>

      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Primary Passenger Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="e.g. Ye Htet Aung"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Contact Email (Optional)
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="e.g. passenger@example.com"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Fare Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mt-6">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Fare per seat:</span>
            <span className="font-semibold text-slate-700">${fare.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Selected seats ({selectedSeats.length}):</span>
            <span className="font-semibold text-slate-700">
              {selectedSeats.length > 0 ? selectedSeats.sort((a, b) => a - b).join(", ") : "None"}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-800">Total Amount:</span>
            <span className="text-xl font-extrabold text-emerald-600">
              ${totalFare.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading || selectedSeats.length === 0}
          className={`
            w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md
            ${
              loading || selectedSeats.length === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-emerald-600/20"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming Reservation...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Reserve {selectedSeats.length > 0 ? `(${selectedSeats.length} Seats)` : ""}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

