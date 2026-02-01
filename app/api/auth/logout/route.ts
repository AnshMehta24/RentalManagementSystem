import { NextRequest, NextResponse } from "next/server";

function clearAuthCookie(response: NextResponse) {
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Safe redirect: only allow relative paths to avoid open redirect. */
function getRedirectUrl(request: NextRequest): string {
  const redirect = request.nextUrl.searchParams.get("redirect");
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/";
  }
  return redirect;
}

export async function GET(request: NextRequest) {
  const redirectUrl = getRedirectUrl(request);
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  clearAuthCookie(response);
  return response;
}

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );
  clearAuthCookie(response);
  return response;
}
