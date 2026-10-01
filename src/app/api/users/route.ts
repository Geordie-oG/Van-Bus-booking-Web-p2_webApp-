import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { User } from "@/models";
import { hashPassword, requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // User records (names, emails, roles) are only visible to administrators.
    const admin = await requireAdmin(request);
    if (!admin) {
      return errorResponse("Forbidden: administrator access required", 403);
    }

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
    // Creating users directly is an administrative action.
    const admin = await requireAdmin(request);
    if (!admin) {
      return errorResponse("Forbidden: administrator access required", 403);
    }

    await connectDB();
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse("name, email, and password are required", 400);
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters long", 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
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

