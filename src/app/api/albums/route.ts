import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/albums - Obtener todos los álbumes
export async function GET() {
  try {
    const albums = await query(`
      SELECT 
        a.*,
        COUNT(p.id) as photo_count,
        SUM(p.file_size) as total_size
      FROM albums a
      LEFT JOIN photos p ON a.id = p.album_id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);

    return NextResponse.json(albums);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json({ error: "Error al obtener álbumes" }, { status: 500 });
  }
}

// POST /api/albums - Crear nuevo álbum
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    await requireAuth();

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const id = uuidv4();

    await query("INSERT INTO albums (id, name, description) VALUES (?, ?, ?)", [id, name, description || null]);

    const album = await queryOne("SELECT * FROM albums WHERE id = ?", [id]);

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.error("Error creating album:", error);
    return NextResponse.json({ error: "Error al crear álbum" }, { status: 500 });
  }
}
