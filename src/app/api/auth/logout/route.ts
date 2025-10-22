import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      success: true,
      message: "Sesión cerrada correctamente",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}
