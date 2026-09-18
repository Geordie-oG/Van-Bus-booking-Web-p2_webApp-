import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Vehicle } from "@/models";

// GET /api/vehicles: List vehicles
export async function GET() {
  try {
    await connectDB();
    const vehicles = await Vehicle.find().sort({ createdAt: -1 }).lean();
    return successResponse(vehicles, "Vehicles retrieved successfully");
  } catch (error: any) {
    console.error("Error retrieving vehicles:", error);
    return errorResponse(error.message || "Failed to retrieve vehicles", 500);
  }
}

// POST /api/vehicles: Create a vehicle
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { plateNumber, type, capacity, status } = body;

    if (!plateNumber || !capacity) {
      return errorResponse("plateNumber and capacity are required", 400);
    }

    if (capacity <= 0) {
      return errorResponse("Capacity must be greater than zero", 400);
    }

    const vehicle = await Vehicle.create({
      plateNumber: plateNumber.trim().toUpperCase(),
      type: type || "van",
      capacity: Number(capacity),
      status: status || "active",
    });

    return successResponse(vehicle, "Vehicle created successfully", 201);
  } catch (error: any) {
    if (error.code === 11000) {
      return errorResponse("Vehicle with this plate number already exists", 409);
    }
    console.error("Error creating vehicle:", error);
    return errorResponse(error.message || "Failed to create vehicle", 500);
  }
}

