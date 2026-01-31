import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "./utils/auth";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
];

// Public API routes
const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/signup",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Allow public routes
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Read auth token
  const token = request.cookies.get("auth_token")?.value;

  // No token
  if (!token) {
    // API requests → JSON
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Page requests → redirect
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = await verifyAuthToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  const { role } = payload;

  // Vendor routes protection
  if (pathname.startsWith("/vendor") && role !== "VENDOR") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Customer routes protection
  if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
 
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
