import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { User } from "@/models";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse("Name, email, and password are required", 400);
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters long", 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return errorResponse("An account with this email already exists", 409);
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);
    const assignedRole = role === "administrator" ? "administrator" : "customer";

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
    });

    const payload = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signToken(payload);

    const response = successResponse(
      { user: payload, token },
      "Registration successful",
      201
    );

    // Set HTTP-only auth cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return errorResponse(error.message || "Failed to register user", 500);
  }
}

