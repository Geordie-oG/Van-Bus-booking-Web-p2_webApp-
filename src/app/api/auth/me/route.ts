import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return errorResponse("Not authenticated", 401);
    }

    return successResponse(authUser, "Current user profile retrieved");
  } catch (error: any) {
    console.error("Auth me error:", error);
    return errorResponse(error.message || "Failed to retrieve user", 500);
  }
}

