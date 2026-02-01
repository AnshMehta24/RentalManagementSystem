import { NextRequest } from "next/server";
import { verifyAuthToken } from "@/utils/auth";

export interface VendorAuthResult {
  userId: number;
  email: string;
  role: "VENDOR";
}

/**
 * Require vendor role for API routes.
 * Returns auth payload if user is VENDOR, null otherwise.
 */
export async function requireVendor(
  request: NextRequest
): Promise<VendorAuthResult | null> {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== "VENDOR") return null;

  return {
    userId: payload.userId,
    email: payload.email,
    role: "VENDOR",
  };
}
