import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { Vehicle, Trip } from "@/models";
import mongoose from "mongoose";

// GET /api/vehicles/:id: Get vehicle details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid vehicle ID format", 400);
    }

    const vehicle = await Vehicle.findById(id).lean();
    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    return successResponse(vehicle, "Vehicle retrieved successfully");
  } catch (error: any) {
    console.error("Error retrieving vehicle:", error);
    return errorResponse(error.message || "Failed to retrieve vehicle", 500);
  }
}

// PATCH /api/vehicles/:id: Update vehicle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { plateNumber, type, capacity, status } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid vehicle ID format", 400);
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    if (plateNumber) {
      const existing = await Vehicle.findOne({
        plateNumber: plateNumber.trim().toUpperCase(),
        _id: { $ne: vehicle._id },
      });
      if (existing) {
        return errorResponse("Another vehicle already has this plate number", 409);
      }
      vehicle.plateNumber = plateNumber.trim().toUpperCase();
    }

    if (type && ["van", "bus"].includes(type)) {
      vehicle.type = type;
    }

    if (capacity !== undefined) {
      if (Number(capacity) <= 0) {
        return errorResponse("Capacity must be greater than zero", 400);
      }
      vehicle.capacity = Number(capacity);
    }

    if (status && ["active", "inactive"].includes(status)) {
      vehicle.status = status;
    }

    await vehicle.save();
    return successResponse(vehicle, "Vehicle updated successfully");
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    return errorResponse(error.message || "Failed to update vehicle", 500);
  }
}

// DELETE /api/vehicles/:id: Deactivate or remove vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid vehicle ID format", 400);
    }

    // Check if any upcoming scheduled trips use this vehicle
    const activeTrips = await Trip.find({
      vehicleId: id,
      status: "scheduled",
      departureTime: { $gte: new Date() },
    });

    if (activeTrips.length > 0) {
      return errorResponse(
        `Cannot remove or deactivate vehicle: It is assigned to ${activeTrips.length} upcoming scheduled trip(s)`,
        400
      );
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    // Soft delete by setting status to inactive
    vehicle.status = "inactive";
    await vehicle.save();

    return successResponse(
      vehicle,
      "Vehicle deactivated successfully. No longer available for new trips."
    );
  } catch (error: any) {
    console.error("Error deactivating vehicle:", error);
    return errorResponse(error.message || "Failed to deactivate vehicle", 500);
  }
}

