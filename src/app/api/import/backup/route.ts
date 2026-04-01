import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

interface BackupAlbum {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface BackupPhoto {
  id: string;
  image_url: string;
  description?: string;
  year?: number | null;
  album_id?: string | null;
  file_size?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface Backup {
  version?: number;
  albums: BackupAlbum[];
  photos: BackupPhoto[];
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const backup = (await request.json()) as Backup;

    if (!backup.albums || !backup.photos) {
      return NextResponse.json({ error: "Formato de backup inválido" }, { status: 400 });
    }

    let albumsImported = 0;
    let photosImported = 0;
    let albumsSkipped = 0;
    let photosSkipped = 0;

    // Importar álbumes (INSERT IGNORE para no duplicar)
    for (const album of backup.albums) {
      try {
        const result = (await query("INSERT IGNORE INTO albums (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [
          album.id,
          album.name,
          album.description ?? null,
          album.created_at ? new Date(album.created_at) : new Date(),
          album.updated_at ? new Date(album.updated_at) : new Date(),
        ])) as unknown as { affectedRows: number };

        if (result.affectedRows > 0) {
          albumsImported++;
        } else {
          albumsSkipped++;
        }
      } catch {
        albumsSkipped++;
      }
    }

    // Importar fotos (INSERT IGNORE para no duplicar)
    for (const photo of backup.photos) {
      try {
        const result = (await query(
          "INSERT IGNORE INTO photos (id, image_url, description, year, album_id, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            photo.id,
            photo.image_url,
            photo.description ?? null,
            photo.year ?? null,
            photo.album_id ?? null,
            photo.file_size ?? null,
            photo.created_at ? new Date(photo.created_at) : new Date(),
            photo.updated_at ? new Date(photo.updated_at) : new Date(),
          ]
        )) as unknown as { affectedRows: number };

        if (result.affectedRows > 0) {
          photosImported++;
        } else {
          photosSkipped++;
        }
      } catch {
        photosSkipped++;
      }
    }

    return NextResponse.json({
      success: true,
      albumsImported,
      albumsSkipped,
      photosImported,
      photosSkipped,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.error("Error importando backup:", error);
    return NextResponse.json({ error: "Error al importar" }, { status: 500 });
  }
}
