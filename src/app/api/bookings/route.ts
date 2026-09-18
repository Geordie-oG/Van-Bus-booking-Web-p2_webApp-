import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Booking, Trip, Vehicle, User } from "@/models";
import mongoose from "mongoose";

// GET /api/bookings: List bookings with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const tripId = searchParams.get("tripId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    // Optional auth header for development/integration: x-user-id or x-user-role
    const headerUserId = request.headers.get("x-user-id");
    const headerUserRole = request.headers.get("x-user-role");

    const query: Record<string, any> = {};

    if (tripId && mongoose.Types.ObjectId.isValid(tripId)) {
      query.tripId = new mongoose.Types.ObjectId(tripId);
    }

    // Role-based filtering: If user is a customer, only allow viewing their own bookings
    if (headerUserRole === "customer" && headerUserId) {
      query.userId = new mongoose.Types.ObjectId(headerUserId);
    } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({
        path: "tripId",
        populate: { path: "vehicleId", select: "plateNumber type capacity" },
      })
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(bookings, "Bookings retrieved successfully");
  } catch (error: any) {
    console.error("Error retrieving bookings:", error);
    return errorResponse(error.message || "Failed to retrieve bookings", 500);
  }
}

// POST /api/bookings: Create a new booking with full validation & race-condition duplicate protection
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { tripId, userId, seatNumbers, passengerName } = body;

    // 1. Validate required fields
    if (!tripId || !userId || !seatNumbers || !passengerName) {
      return errorResponse(
        "Missing required fields: tripId, userId, seatNumbers, and passengerName are required",
        400
      );
    }

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return errorResponse("Invalid tripId format", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse("Invalid userId format", 400);
    }

    if (typeof passengerName !== "string" || passengerName.trim().length < 2) {
      return errorResponse("Passenger name must be at least 2 characters long", 400);
    }

    // 2. Validate seatNumbers array
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return errorResponse("seatNumbers must be a non-empty array of seat numbers", 400);
    }

    // Ensure all seats are positive integers
    const validSeats = seatNumbers.every(
      (seat) => typeof seat === "number" && Number.isInteger(seat) && seat > 0
    );
    if (!validSeats) {
      return errorResponse("All seat numbers must be positive integers", 400);
    }

    // Check for internal duplicate seats in request
    const uniqueSeatsInRequest = Array.from(new Set(seatNumbers));
    if (uniqueSeatsInRequest.length !== seatNumbers.length) {
      return errorResponse("Duplicate seat numbers cannot be selected within the same booking", 400);
    }

    // 3. Verify Trip and Vehicle
    const trip = await Trip.findById(tripId).populate("vehicleId");
    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    // Prevent bookings for non-scheduled, departed, or completed trips
    if (trip.status !== "scheduled") {
      return errorResponse(
        `Cannot book trip with status '${trip.status}'. Bookings are only accepted for scheduled trips.`,
        400
      );
    }

    if (new Date(trip.departureTime) <= new Date()) {
      return errorResponse("Cannot book a trip that has already departed", 400);
    }

    const vehicle = trip.vehicleId as any;
    if (!vehicle || !vehicle.capacity) {
      return errorResponse("Trip vehicle configuration is invalid or missing", 500);
    }

    // 4. Reject seat numbers outside vehicle capacity
    const invalidSeats = seatNumbers.filter(
      (seat) => seat < 1 || seat > vehicle.capacity
    );
    if (invalidSeats.length > 0) {
      return errorResponse(
        `Seat number(s) ${invalidSeats.join(", ")} exceed vehicle capacity of ${vehicle.capacity}`,
        400
      );
    }

    // 5. Pre-check against already booked active seats
    const conflictingBookings = await Booking.find({
      tripId: trip._id,
      status: { $ne: "cancelled" },
      seatNumbers: { $in: seatNumbers },
    }).lean();

    if (conflictingBookings.length > 0) {
      const alreadyTaken = new Set<number>();
      for (const b of conflictingBookings) {
        for (const s of b.seatNumbers) {
          if (seatNumbers.includes(s)) {
            alreadyTaken.add(s);
          }
        }
      }
      return errorResponse(
        `Seat(s) ${Array.from(alreadyTaken).sort((a, b) => a - b).join(", ")} are already reserved for this trip`,
        409
      );
    }

    // 6. Atomically persist booking with duplicate protection (MongoDB code 11000 handles race conditions)
    try {
      const newBooking = await Booking.create({
        tripId: trip._id,
        userId: new mongoose.Types.ObjectId(userId),
        seatNumbers: uniqueSeatsInRequest.sort((a, b) => a - b),
        passengerName: passengerName.trim(),
        status: "confirmed",
      });

      const populatedBooking = await Booking.findById(newBooking._id)
        .populate({
          path: "tripId",
          populate: { path: "vehicleId", select: "plateNumber type capacity" },
        })
        .populate("userId", "name email role")
        .lean();

      return successResponse(
        populatedBooking,
        "Booking confirmed successfully",
        201
      );
    } catch (dbError: any) {
      // MongoDB duplicate key error code 11000
      if (dbError.code === 11000) {
        return errorResponse(
          "One or more selected seats were just reserved by another customer. Please refresh and select available seats.",
          409
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return errorResponse(error.message || "Failed to create booking", 500);
  }
}

