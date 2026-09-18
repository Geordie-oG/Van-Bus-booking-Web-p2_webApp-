import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Booking, Trip } from "@/models";
import mongoose from "mongoose";

// GET /api/bookings/:id: View single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid booking ID format", 400);
    }

    const booking = await Booking.findById(id)
      .populate({
        path: "tripId",
        populate: { path: "vehicleId", select: "plateNumber type capacity" },
      })
      .populate("userId", "name email role")
      .lean();

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    // Role check: If customer, ensure they own the booking
    const headerUserId = request.headers.get("x-user-id");
    const headerUserRole = request.headers.get("x-user-role");
    if (
      headerUserRole === "customer" &&
      headerUserId &&
      (booking.userId as any)?._id?.toString() !== headerUserId
    ) {
      return errorResponse("Unauthorized: You can only view your own bookings", 403);
    }

    return successResponse(booking, "Booking details retrieved successfully");
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return errorResponse(error.message || "Failed to fetch booking", 500);
  }
}

// PATCH /api/bookings/:id: Update booking status (e.g., cancel before departure)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid booking ID format", 400);
    }

    const allowedStatuses = ["confirmed", "cancelled", "pending"];
    if (!status || !allowedStatuses.includes(status)) {
      return errorResponse(
        `Invalid status. Status must be one of: ${allowedStatuses.join(", ")}`,
        400
      );
    }

    const booking = await Booking.findById(id).populate("tripId");
    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    const trip = booking.tripId as any;

    // Check ownership if user header is present
    const headerUserId = request.headers.get("x-user-id");
    const headerUserRole = request.headers.get("x-user-role");
    if (
      headerUserRole === "customer" &&
      headerUserId &&
      booking.userId.toString() !== headerUserId
    ) {
      return errorResponse("Unauthorized: You can only modify your own bookings", 403);
    }

    // If attempting to cancel, enforce that the trip has not already departed
    if (status === "cancelled") {
      if (trip && new Date(trip.departureTime) <= new Date()) {
        return errorResponse(
          "Cannot cancel booking because the trip has already departed",
          400
        );
      }
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate({
        path: "tripId",
        populate: { path: "vehicleId", select: "plateNumber type capacity" },
      })
      .populate("userId", "name email role")
      .lean();

    return successResponse(
      updatedBooking,
      `Booking status updated to '${status}' successfully`
    );
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return errorResponse(error.message || "Failed to update booking", 500);
  }
}

// DELETE /api/bookings/:id: Cancel booking before departure
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid booking ID format", 400);
    }

    const booking = await Booking.findById(id).populate("tripId");
    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    const trip = booking.tripId as any;

    // Verify departure time
    if (trip && new Date(trip.departureTime) <= new Date()) {
      return errorResponse(
        "Cannot cancel booking because the trip has already departed",
        400
      );
    }

    // Check customer ownership
    const headerUserId = request.headers.get("x-user-id");
    const headerUserRole = request.headers.get("x-user-role");
    if (
      headerUserRole === "customer" &&
      headerUserId &&
      booking.userId.toString() !== headerUserId
    ) {
      return errorResponse("Unauthorized: You can only cancel your own bookings", 403);
    }

    // Set status to cancelled so seats are released
    booking.status = "cancelled";
    await booking.save();

    return successResponse(
      { bookingId: id, status: "cancelled", releasedSeats: booking.seatNumbers },
      "Booking cancelled successfully. Reserved seats have been released."
    );
  } catch (error: any) {
    console.error("Error cancelling booking:", error);
    return errorResponse(error.message || "Failed to cancel booking", 500);
  }
}

