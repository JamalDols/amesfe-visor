import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { deleteFile, getRemotePathFromUrl } from "@/lib/ftp";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/photos/[id] - Obtener una foto específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const photo = await queryOne(
      `
      SELECT p.*, a.name as album_name 
      FROM photos p 
      LEFT JOIN albums a ON p.album_id = a.id 
      WHERE p.id = ?
    `,
      [id]
    );

    if (!photo) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json({ error: "Error al obtener foto" }, { status: 500 });
  }
}

// PUT /api/photos/[id] - Actualizar foto
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const { description, year, album_id } = body;

    await query("UPDATE photos SET description = ?, year = ?, album_id = ? WHERE id = ?", [description || null, year || null, album_id || null, id]);

    const photo = await queryOne(
      `SELECT p.*, a.name as album_name 
       FROM photos p 
       LEFT JOIN albums a ON p.album_id = a.id 
       WHERE p.id = ?`,
      [id]
    );

    if (!photo) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.error("Error updating photo:", error);
    return NextResponse.json({ error: "Error al actualizar foto" }, { status: 500 });
  }
}

// DELETE /api/photos/[id] - Eliminar foto
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    // Obtener la foto para saber la URL del archivo
    const photo = await queryOne<{ image_url: string }>("SELECT image_url FROM photos WHERE id = ?", [id]);

    if (!photo) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    // Eliminar el archivo del FTP
    try {
      const remotePath = getRemotePathFromUrl(photo.image_url);
      await deleteFile(remotePath);
    } catch (ftpError) {
      console.error("Error eliminando archivo del FTP:", ftpError);
      // Continuar aunque falle la eliminación del FTP
    }

    // Eliminar el registro de la base de datos
    await query("DELETE FROM photos WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Foto eliminada correctamente",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Error al eliminar foto" }, { status: 500 });
  }
}
