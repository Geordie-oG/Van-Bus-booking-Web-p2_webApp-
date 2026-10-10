import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { COOKIE_NAME, hashPassword, signToken } from "@/lib/auth";
import { User } from "@/models";

export async function POST() {
  try {
    await connectDB();

    const guestId = randomUUID();
    const user = await User.create({
      name: "Guest",
      email: `guest-${guestId}@guest.goroute.local`,
      passwordHash: await hashPassword(randomUUID()),
      role: "customer",
    });

    const payload = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = signToken(payload);
    const response = successResponse(payload, "Guest session created", 201);

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Guest session error:", error);
    return errorResponse(error.message || "Failed to create guest session", 500);
  }
}
