import { NextRequest } from "next/server";
import { verifyAuthToken } from "@/utils/auth";

export interface SuperAdminAuthResult {
  userId: number;
  email: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
}

/**
 * Require Super Admin (ADMIN role) for API routes.
 * Returns auth payload if user is ADMIN, null otherwise.
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<SuperAdminAuthResult | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== "ADMIN") return null;

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}
