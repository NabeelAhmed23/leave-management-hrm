import { NextRequest, NextResponse } from "next/server";

// Define route patterns
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/invite",
];

// Helper function to check route type
function getRouteType(pathname: string): "auth" | "protected" | "public" {
  if (authRoutes.some(route => pathname.startsWith(route))) {
    return "auth";
  }
  return "protected";
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuth = req.cookies.get("next-auth.session-token")?.value || undefined;
  const routeType = getRouteType(pathname);
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  switch (routeType) {
    case "auth":
      // If user is authenticated and tries to access auth pages, redirect to dashboard
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      break;

    case "protected":
      // If user is not authenticated and tries to access protected pages, redirect to login
      if (!isAuth) {
        // Store the intended destination for after login
        const redirectUrl = new URL("/login", req.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }
      break;

    case "public":
      // Public routes are always accessible
      break;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that don't need auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
