import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/albums/[id] - Obtener un álbum específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const album = await queryOne(
      `
      SELECT 
        a.*,
        COUNT(p.id) as photo_count,
        SUM(p.file_size) as total_size
      FROM albums a
      LEFT JOIN photos p ON a.id = p.album_id
      WHERE a.id = ?
      GROUP BY a.id
    `,
      [id]
    );

    if (!album) {
      return NextResponse.json({ error: "Álbum no encontrado" }, { status: 404 });
    }

    // Obtener las fotos del álbum
    const photos = await query("SELECT * FROM photos WHERE album_id = ? ORDER BY created_at DESC", [id]);

    return NextResponse.json({
      ...album,
      photos,
    });
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json({ error: "Error al obtener álbum" }, { status: 500 });
  }
}

// PUT /api/albums/[id] - Actualizar álbum
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    await query("UPDATE albums SET name = ?, description = ? WHERE id = ?", [name, description || null, id]);

    const album = await queryOne("SELECT * FROM albums WHERE id = ?", [id]);

    if (!album) {
      return NextResponse.json({ error: "Álbum no encontrado" }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.error("Error updating album:", error);
    return NextResponse.json({ error: "Error al actualizar álbum" }, { status: 500 });
  }
}

// DELETE /api/albums/[id] - Eliminar álbum
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    // Primero desasignar todas las fotos del álbum
    await query("UPDATE photos SET album_id = NULL WHERE album_id = ?", [id]);

    // Luego eliminar el álbum
    await query("DELETE FROM albums WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Álbum eliminado correctamente",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.error("Error deleting album:", error);
    return NextResponse.json({ error: "Error al eliminar álbum" }, { status: 500 });
  }
}
