import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { User } from "@/models";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 }).lean();
    return successResponse(users, "Users retrieved successfully");
  } catch (error: any) {
    console.error("Error retrieving users:", error);
    return errorResponse(error.message || "Failed to retrieve users", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse("name, email, and password are required", 400);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: `hash_${password}`, // Simplified hash placeholder for Member 3
      role: role || "customer",
    });

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    return successResponse(userObj, "User created successfully", 201);
  } catch (error: any) {
    if (error.code === 11000) {
      return errorResponse("User with this email already exists", 409);
    }
    console.error("Error creating user:", error);
    return errorResponse(error.message || "Failed to create user", 500);
  }
}

