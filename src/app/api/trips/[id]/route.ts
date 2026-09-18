import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Trip } from "@/models";
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

