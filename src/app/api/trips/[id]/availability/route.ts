import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Trip, Booking, Vehicle } from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid trip ID format", 400);
    }

    // Find trip and populate vehicle information
    const trip = await Trip.findById(id).populate("vehicleId").lean();

    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    const vehicle = trip.vehicleId as unknown as {
      _id: string;
      plateNumber: string;
      type: "van" | "bus";
      capacity: number;
      status: string;
    };

    if (!vehicle || !vehicle.capacity || vehicle.capacity <= 0) {
      return errorResponse("Associated vehicle data is missing or invalid", 500);
    }

    const totalCapacity = vehicle.capacity;

    // Fetch all active, non-cancelled bookings for this trip
    const activeBookings = await Booking.find(
      {
        tripId: trip._id,
        status: { $ne: "cancelled" },
      },
      "seatNumbers status"
    ).lean();

    // Flatten all booked seat numbers and sort
    const bookedSeatsSet = new Set<number>();
    for (const b of activeBookings) {
      if (Array.isArray(b.seatNumbers)) {
        for (const seat of b.seatNumbers) {
          bookedSeatsSet.add(seat);
        }
      }
    }

    const bookedSeats = Array.from(bookedSeatsSet).sort((a, b) => a - b);

    // Compute list of available seat numbers (1 to totalCapacity)
    const availableSeats: number[] = [];
    for (let seat = 1; seat <= totalCapacity; seat++) {
      if (!bookedSeatsSet.has(seat)) {
        availableSeats.push(seat);
      }
    }

    const isBookingAllowed =
      trip.status === "scheduled" && new Date(trip.departureTime) > new Date();

    return successResponse(
      {
        tripId: trip._id,
        origin: trip.origin,
        destination: trip.destination,
        departureTime: trip.departureTime,
        status: trip.status,
        vehicle: {
          plateNumber: vehicle.plateNumber,
          type: vehicle.type,
          capacity: totalCapacity,
        },
        totalCapacity,
        bookedSeats,
        availableSeats,
        remainingCapacity: availableSeats.length,
        isBookingAllowed,
      },
      "Seat availability retrieved successfully"
    );
  } catch (error: any) {
    console.error("Error retrieving seat availability:", error);
    return errorResponse(
      error.message || "Failed to retrieve seat availability",
      500
    );
  }
}

