import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    console.log("🔍 /api/auth/me called");
    const user = await getCurrentUser();

    console.log("👤 Current user:", user ? user.email : "null");

    if (!user) {
      console.log("❌ No user found, returning 401");
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    console.log("✅ User authenticated, returning user data");
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Me error:", error);
    return NextResponse.json({ error: "Error al verificar sesión" }, { status: 500 });
  }
}
