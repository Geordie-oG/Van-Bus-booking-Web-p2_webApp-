"use client";

import React from "react";
import { Check, X, ShieldAlert } from "lucide-react";

interface SeatSelectorProps {
  totalCapacity: number;
  vehicleType?: "van" | "bus";
  bookedSeats: number[];
  selectedSeats: number[];
  onToggleSeat: (seatNumber: number) => void;
  disabled?: boolean;
}

export default function SeatSelector({
  totalCapacity,
  vehicleType = "van",
  bookedSeats,
  selectedSeats,
  onToggleSeat,
  disabled = false,
}: SeatSelectorProps) {
  const bookedSet = new Set(bookedSeats);
  const selectedSet = new Set(selectedSeats);

  // Generate an array of seat numbers [1, 2, ..., totalCapacity]
  const seats = Array.from({ length: totalCapacity }, (_, i) => i + 1);

  // Layout configuration:
  // For 'van': 3 seats per row (2 on left, aisle, 1 on right)
  // For 'bus': 4 seats per row (2 on left, aisle, 2 on right)
  const isBus = vehicleType === "bus";
  const leftCount = 2;
  const rightCount = isBus ? 2 : 1;
  const rowSize = leftCount + rightCount;

  // Split seats into rows
  const rows: { left: number[]; right: number[] }[] = [];
  for (let i = 0; i < seats.length; i += rowSize) {
    const chunk = seats.slice(i, i + rowSize);
    const left = chunk.slice(0, leftCount);
    const right = chunk.slice(leftCount);
    rows.push({ left, right });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
            Select Your Seats
            <span className="text-xs font-normal bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {vehicleType} ({totalCapacity} Seats)
            </span>
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Click an available seat to select or deselect.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white inline-block"></span>
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-emerald-600 border border-emerald-700 text-white flex items-center justify-center text-[10px]">
              ✓
            </span>
            <span className="text-slate-900 font-semibold">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-slate-200 border border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">
              ✕
            </span>
            <span className="text-slate-400">Booked</span>
          </div>
        </div>
      </div>

      {/* Vehicle Outline Diagram */}
      <div className="mt-6 max-w-md mx-auto bg-slate-50/80 border-2 border-slate-200 rounded-3xl p-6 relative">
        {/* Front of Vehicle: Windshield & Driver */}
        <div className="border-b-2 border-dashed border-slate-300 pb-4 mb-6">
          <div className="flex items-center justify-between px-4">
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Front / Windshield
            </div>
            {/* Driver cabin seat */}
            <div className="flex items-center gap-2 bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
              Driver
            </div>
          </div>
        </div>

        {/* Seat Grid Rows */}
        <div className="space-y-3.5">
          {rows.map((row, rIndex) => (
            <div key={rIndex} className="flex items-center justify-between gap-4">
              {/* Left group */}
              <div className="flex items-center gap-2">
                {row.left.map((seatNum) => {
                  const isBooked = bookedSet.has(seatNum);
                  const isSelected = selectedSet.has(seatNum);

                  return (
                    <button
                      key={seatNum}
                      type="button"
                      disabled={isBooked || disabled}
                      onClick={() => onToggleSeat(seatNum)}
                      aria-label={`Seat ${seatNum} ${
                        isBooked ? "Booked" : isSelected ? "Selected" : "Available"
                      }`}
                      className={`
                        w-12 h-12 rounded-xl text-sm font-semibold transition-all flex flex-col items-center justify-center relative
                        ${
                          isBooked
                            ? "bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed opacity-60"
                            : isSelected
                            ? "bg-emerald-600 text-white border-2 border-emerald-700 shadow-md scale-105"
                            : "bg-white border-2 border-slate-300 hover:border-emerald-500 hover:text-emerald-700 hover:shadow text-slate-700 active:scale-95"
                        }
                      `}
                    >
                      <span>{seatNum}</span>
                      {isSelected && <Check className="w-3 h-3 text-white mt-0.5" />}
                      {isBooked && <X className="w-3 h-3 text-slate-400 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Aisle */}
              <div className="flex-1 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 select-none">
                  Aisle
                </span>
              </div>

              {/* Right group */}
              <div className="flex items-center gap-2">
                {row.right.map((seatNum) => {
                  const isBooked = bookedSet.has(seatNum);
                  const isSelected = selectedSet.has(seatNum);

                  return (
                    <button
                      key={seatNum}
                      type="button"
                      disabled={isBooked || disabled}
                      onClick={() => onToggleSeat(seatNum)}
                      aria-label={`Seat ${seatNum} ${
                        isBooked ? "Booked" : isSelected ? "Selected" : "Available"
                      }`}
                      className={`
                        w-12 h-12 rounded-xl text-sm font-semibold transition-all flex flex-col items-center justify-center relative
                        ${
                          isBooked
                            ? "bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed opacity-60"
                            : isSelected
                            ? "bg-emerald-600 text-white border-2 border-emerald-700 shadow-md scale-105"
                            : "bg-white border-2 border-slate-300 hover:border-emerald-500 hover:text-emerald-700 hover:shadow text-slate-700 active:scale-95"
                        }
                      `}
                    >
                      <span>{seatNum}</span>
                      {isSelected && <Check className="w-3 h-3 text-white mt-0.5" />}
                      {isBooked && <X className="w-3 h-3 text-slate-400 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Back of Vehicle */}
        <div className="border-t-2 border-dashed border-slate-300 pt-4 mt-6 text-center">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Rear / Back
          </span>
        </div>
      </div>

      {/* Selection Summary Alert */}
      <div className="mt-6 flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-sm">
        <div className="text-slate-700">
          <span className="font-semibold text-emerald-900">
            {selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"} selected
          </span>
          {selectedSeats.length > 0 && (
            <span className="text-slate-600 ml-2">
              (Seats: {selectedSeats.sort((a, b) => a - b).join(", ")})
            </span>
          )}
        </div>
        {selectedSeats.length === 0 && (
          <span className="text-xs text-amber-700 font-medium">Please pick at least 1 seat</span>
        )}
      </div>
    </div>
  );
}

