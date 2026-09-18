import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Trip, Vehicle, Booking } from "@/models";
import mongoose from "mongoose";

// GET /api/trips/:id
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

    const trip = await Trip.findById(id).populate("vehicleId").lean();

    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    return successResponse(trip, "Trip details retrieved successfully");
  } catch (error: any) {
    console.error("Error fetching trip:", error);
    return errorResponse(error.message || "Failed to fetch trip", 500);
  }
}

// PATCH /api/trips/:id: Update trip details or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { vehicleId, origin, destination, departureTime, fare, status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid trip ID format", 400);
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    if (vehicleId) {
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return errorResponse("Invalid vehicleId format", 400);
      }
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || vehicle.status !== "active") {
        return errorResponse("Assigned vehicle is not active or does not exist", 400);
      }
      trip.vehicleId = vehicle._id as any;
    }

    if (origin) trip.origin = origin.trim();
    if (destination) trip.destination = destination.trim();
    if (fare !== undefined) {
      if (Number(fare) < 0) return errorResponse("Fare cannot be negative", 400);
      trip.fare = Number(fare);
    }

    if (departureTime) {
      const depDate = new Date(departureTime);
      if (isNaN(depDate.getTime())) return errorResponse("Invalid departure date", 400);
      trip.departureTime = depDate;
    }

    if (status && ["scheduled", "departed", "completed", "cancelled"].includes(status)) {
      trip.status = status;
      // If trip is cancelled, cancel all active bookings associated with it
      if (status === "cancelled") {
        await Booking.updateMany(
          { tripId: trip._id, status: { $ne: "cancelled" } },
          { status: "cancelled" }
        );
      }
    }

    await trip.save();
    const updatedTrip = await Trip.findById(trip._id).populate("vehicleId").lean();

    return successResponse(updatedTrip, "Trip updated successfully");
  } catch (error: any) {
    console.error("Error updating trip:", error);
    return errorResponse(error.message || "Failed to update trip", 500);
  }
}

// DELETE /api/trips/:id: Cancel trip
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid trip ID format", 400);
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    trip.status = "cancelled";
    await trip.save();

    // Release all booked seats for this trip
    await Booking.updateMany(
      { tripId: trip._id, status: { $ne: "cancelled" } },
      { status: "cancelled" }
    );

    return successResponse(trip, "Trip cancelled successfully and all seats released");
  } catch (error: any) {
    console.error("Error cancelling trip:", error);
    return errorResponse(error.message || "Failed to cancel trip", 500);
  }
}
