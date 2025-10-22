import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { deleteFile, getRemotePathFromUrl } from "@/lib/ftp";

// GET /api/photos - Obtener todas las fotos o filtrar
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const albumId = searchParams.get("album_id");
    const unassigned = searchParams.get("unassigned");
    const search = searchParams.get("search");
    const year = searchParams.get("year");

    let sql = `
      SELECT 
        p.*,
        a.name as album_name
      FROM photos p
      LEFT JOIN albums a ON p.album_id = a.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    // Filtros
    if (albumId) {
      sql += " AND p.album_id = ?";
      params.push(albumId);
    }

    if (unassigned === "true") {
      sql += " AND p.album_id IS NULL";
    }

    if (search) {
      sql += " AND (p.description LIKE ? OR a.name LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (year) {
      sql += " AND p.year = ?";
      params.push(parseInt(year));
    }

    sql += " ORDER BY p.created_at DESC";

    const photos = await query(sql, params);

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json({ error: "Error al obtener fotos" }, { status: 500 });
  }
}

// POST /api/photos - Crear nueva foto (metadata, el archivo se sube por /api/upload)
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { image_url, description, year, album_id, file_size } = body;

    if (!image_url) {
      return NextResponse.json({ error: "La URL de la imagen es requerida" }, { status: 400 });
    }

    const id = uuidv4();

    await query("INSERT INTO photos (id, image_url, description, year, album_id, file_size) VALUES (?, ?, ?, ?, ?, ?)", [
      id,
      image_url,
      description || null,
      year || null,
      album_id || null,
      file_size || 0,
    ]);

    const photo = await queryOne(
      `SELECT p.*, a.name as album_name 
       FROM photos p 
       LEFT JOIN albums a ON p.album_id = a.id 
       WHERE p.id = ?`,
      [id]
    );

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.error("Error creating photo:", error);
    return NextResponse.json({ error: "Error al crear foto" }, { status: 500 });
  }
}
