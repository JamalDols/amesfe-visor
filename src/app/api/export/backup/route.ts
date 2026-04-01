import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const albums = await query("SELECT id, name, description, created_at, updated_at FROM albums ORDER BY created_at");
    const photos = await query("SELECT id, image_url, description, year, album_id, file_size, created_at, updated_at FROM photos ORDER BY created_at");

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      albums,
      photos,
    };

    const json = JSON.stringify(backup, null, 2);
    const filename = `amesfe-backup-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("Error exportando backup:", error);
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 });
  }
}
