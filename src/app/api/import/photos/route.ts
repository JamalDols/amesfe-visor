import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import { createFTPClient, uploadFileWithClient } from "@/lib/ftp";
import { query } from "@/lib/db";
import sharp from "sharp";

interface CsvRow {
  filename: string;
  year: string;
  description: string;
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const filenameIdx = header.indexOf("filename");
  const yearIdx = header.indexOf("year");
  const descriptionIdx = header.indexOf("description");

  if (filenameIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      filename: cols[filenameIdx] ?? "",
      year: yearIdx !== -1 ? (cols[yearIdx] ?? "") : "",
      description: descriptionIdx !== -1 ? (cols[descriptionIdx] ?? "") : "",
    };
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function processImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const csvFile = formData.get("csv") as File | null;
    const imageFiles = formData.getAll("images") as File[];

    if (!csvFile) {
      return NextResponse.json({ error: "CSV requerido" }, { status: 400 });
    }

    const csvText = await csvFile.text();
    const csvRows = parseCSV(csvText);

    if (csvRows.length === 0) {
      return NextResponse.json({ error: "El CSV no contiene filas válidas" }, { status: 400 });
    }

    const imageMap = new Map<string, File>();
    for (const file of imageFiles) {
      imageMap.set(file.name.toLowerCase(), file);
    }

    let imported = 0;
    let importedWithoutImage = 0;
    let skipped = 0;
    const errors: { filename: string; error: string }[] = [];

    // Abrir UNA sola conexión FTP para todo el lote (solo si hay imágenes)
    const ftpClient = imageMap.size > 0 ? await createFTPClient() : null;

    try {
      for (const row of csvRows) {
        if (!row.filename) {
          skipped++;
          continue;
        }

        const year = row.year ? parseInt(row.year) : null;
        const yearValue = year !== null && !isNaN(year) ? year : null;
        const file = imageMap.get(row.filename.toLowerCase());

        try {
          if (file && ftpClient) {
            // Modo completo: procesar imagen + subir por conexión FTP compartida
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const processedBuffer = await processImage(buffer);

            const fileId = uuidv4();
            const remotePath = `/web/wp-content/uploads/fotosvisor/${fileId}.webp`;
            const publicUrl = await uploadFileWithClient(ftpClient, processedBuffer, remotePath);

            await query("INSERT INTO photos (id, image_url, description, year, album_id, file_size) VALUES (?, ?, ?, ?, ?, ?)", [
              fileId,
              publicUrl,
              row.description || null,
              yearValue,
              null,
              processedBuffer.length,
            ]);

            imported++;
          } else {
            // Modo CSV-only: guardar solo metadatos, sin imagen
            const fileId = uuidv4();
            await query("INSERT INTO photos (id, image_url, description, year, album_id, file_size) VALUES (?, ?, ?, ?, ?, ?)", [
              fileId,
              "",
              row.description || null,
              yearValue,
              null,
              null,
            ]);

            importedWithoutImage++;
          }
        } catch (err) {
          errors.push({
            filename: row.filename,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }
    } finally {
      ftpClient?.close();
    }

    return NextResponse.json({ success: true, imported, importedWithoutImage, skipped, errors });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error interno" }, { status: 500 });
  }
}
