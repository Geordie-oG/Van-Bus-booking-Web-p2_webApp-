import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { User, IUser } from "@/models";
import { connectDB } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "csx4107_booking_system_secret_key_2026";
const COOKIE_NAME = "auth_token";

export interface AuthPayload {
  userId: string;
  name: string;
  email: string;
  role: "customer" | "administrator";
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare plain password with hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Sign JWT token
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Verify JWT token
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

// Get authenticated user from request (checks Authorization header, cookie, or fallback headers)
export async function getAuthUser(request: NextRequest): Promise<AuthPayload | null> {
  // 1. Check Bearer token in Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) return decoded;
  }

  // 2. Check HTTP-only cookie
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    const decoded = verifyToken(cookieToken);
    if (decoded) return decoded;
  }

  // 3. Fallback development headers (x-user-id, x-user-role)
  const headerUserId = request.headers.get("x-user-id");
  const headerUserRole = (request.headers.get("x-user-role") || "customer") as "customer" | "administrator";
  if (headerUserId) {
    try {
      await connectDB();
      const user = await User.findById(headerUserId).lean();
      if (user) {
        return {
          userId: (user as any)._id.toString(),
          name: (user as any).name,
          email: (user as any).email,
          role: (user as any).role || headerUserRole,
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export { COOKIE_NAME };

