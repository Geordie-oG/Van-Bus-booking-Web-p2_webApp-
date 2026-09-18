import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const response = successResponse(null, "Logged out successfully");

  // Clear cookie
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return response;
}

