import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Obtener la sesión desde las cookies
  const sessionCookie = req.cookies.get("session");
  const isAuthenticated = !!sessionCookie;

  console.log("🔍 Middleware checking:", {
    path: req.nextUrl.pathname,
    hasSessionCookie: isAuthenticated,
    cookieValue: sessionCookie?.value ? "exists" : "none",
  });

  // Solo proteger /admin - redirigir a login si no está autenticado
  if (!isAuthenticated && req.nextUrl.pathname.startsWith("/admin")) {
    console.log("🚫 Middleware: No session, redirecting to /login");
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  console.log("✅ Middleware: Access granted");
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
