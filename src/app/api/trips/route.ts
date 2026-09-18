import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Trip, Vehicle } from "@/models";
import mongoose from "mongoose";

// GET /api/trips: Search and list trips
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const status = searchParams.get("status") || "scheduled";

    const query: Record<string, any> = {};
    if (origin) query.origin = new RegExp(origin, "i");
    if (destination) query.destination = new RegExp(destination, "i");
    if (status !== "all") query.status = status;

    const trips = await Trip.find(query)
      .populate("vehicleId", "plateNumber type capacity status")
      .sort({ departureTime: 1 })
      .lean();

    return successResponse(trips, "Trips retrieved successfully");
  } catch (error: any) {
    console.error("Error retrieving trips:", error);
    return errorResponse(error.message || "Failed to retrieve trips", 500);
  }
}

// POST /api/trips: Create a scheduled trip
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { vehicleId, origin, destination, departureTime, fare, status } = body;

    if (!vehicleId || !origin || !destination || !departureTime || fare === undefined) {
      return errorResponse(
        "Missing required fields: vehicleId, origin, destination, departureTime, fare",
        400
      );
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return errorResponse("Invalid vehicleId format", 400);
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.status !== "active") {
      return errorResponse("Assigned vehicle not found or inactive", 400);
    }

    const depDate = new Date(departureTime);
    if (isNaN(depDate.getTime())) {
      return errorResponse("Invalid departureTime format", 400);
    }

    const trip = await Trip.create({
      vehicleId,
      origin: origin.trim(),
      destination: destination.trim(),
      departureTime: depDate,
      fare: Number(fare),
      status: status || "scheduled",
    });

    const populatedTrip = await Trip.findById(trip._id).populate("vehicleId").lean();
    return successResponse(populatedTrip, "Trip created successfully", 201);
  } catch (error: any) {
    console.error("Error creating trip:", error);
    return errorResponse(error.message || "Failed to create trip", 500);
  }
}

