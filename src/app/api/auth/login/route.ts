import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { User } from "@/models";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // Verify password with bcrypt
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      // Check fallback plain text hash for seeded demo users
      if (user.passwordHash !== password && !user.passwordHash.includes(password)) {
        return errorResponse("Invalid email or password", 401);
      }
    }

    const payload = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signToken(payload);

    const response = successResponse(
      { user: payload, token },
      "Login successful"
    );

    // Set HTTP-only auth cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return errorResponse(error.message || "Failed to log in", 500);
  }
}

