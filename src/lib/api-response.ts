import { NextResponse } from "next/server";

export interface ApiResponseSuccess<T = unknown> {
  success: true;
  data: T;
  message: string;
}

export interface ApiResponseError {
  success: false;
  error: string;
}

export function successResponse<T>(data: T, message = "Request successful", status = 200) {
  return NextResponse.json<ApiResponseSuccess<T>>(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json<ApiResponseError>(
    {
      success: false,
      error,
    },
    { status }
  );
}

