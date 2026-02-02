import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "./utils/auth";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/super-admin/login",
  // '/products'
];

const publicApiRoutes = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/stripe/webhook"
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isPublicApiRoute = publicApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  const isAdminApi = pathname.startsWith("/api/admin");
  const isSuperAdminApi = pathname.startsWith("/api/super-admin");
  const isAdminPage = pathname.startsWith("/admin");
  const isSuperAdminPage = pathname.startsWith("/super-admin");
  const isSuperAdminLogin = pathname === "/super-admin/login";
  const isAdminOrSuperAdminRoute =
    isAdminApi || isSuperAdminApi || isAdminPage || (isSuperAdminPage && !isSuperAdminLogin);

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isAdminOrSuperAdminRoute) {
      const loginUrl = new URL("/super-admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    if (isAdminOrSuperAdminRoute) {
      const response = NextResponse.redirect(new URL("/super-admin/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  const { role } = payload;

  if (isAdminApi || isSuperAdminApi || isAdminPage || isSuperAdminPage) {
    if (role !== "ADMIN") {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { success: false, error: "Forbidden. Super Admin access required." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/vendor") && role !== "VENDOR") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
