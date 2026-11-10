import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import { uploadFile } from "@/lib/ftp";
import { query } from "@/lib/db";
import sharp from "sharp";

/**
 * Convierte un archivo a WebP y lo redimensiona
 */
async function processImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(2000, 2000, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
}

function describeError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : "";

  if (code === "ER_NO_REFERENCED_ROW_2") return "El álbum seleccionado ya no existe.";
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "PROTOCOL_CONNECTION_LOST") return "No se pudo conectar con la base de datos.";
  if (code === "ER_CON_COUNT_ERROR" || code === "ER_USER_LIMIT_REACHED") return "La base de datos tiene demasiadas conexiones. Inténtalo de nuevo en unos segundos.";
  if (/Input buffer contains unsupported image format|Input file is missing|corrupt|unsupported image/i.test(message)) return "La imagen está dañada o su formato no es válido.";
  if (message.startsWith("No se pudo conectar al servidor FTP") || message.startsWith("Error al subir archivo al FTP")) return message;

  return message || "Error desconocido";
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando upload de imágenes...");

    // Verificar autenticación
    await requireAuth();
    console.log("🔐 Usuario autenticado");

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const albumId = formData.get("albumId") as string | null;
    const descriptions = formData.getAll("descriptions") as string[];
    const years = formData.getAll("years") as string[];

    console.log("📁 Archivos recibidos:", files.length);

    if (!files || files.length === 0) {
      console.error("❌ No se enviaron archivos");
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadResults = [];
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const description = descriptions[i] || "";
      const year = years[i] ? parseInt(years[i]) : null;

      console.log(`📸 Procesando archivo ${i + 1}/${files.length}:`, file.name);

      try {
        // Leer el archivo
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Procesar imagen (redimensionar y convertir a WebP)
        const processedBuffer = await processImage(buffer);

        // Generar nombre único
        const fileId = uuidv4();
        const fileName = `${fileId}.webp`;
        const remotePath = `/web/wp-content/uploads/fotosvisor/${fileName}`;

        console.log(`💾 Subiendo a FTP: ${remotePath}`);

        // Subir al FTP
        const publicUrl = await uploadFile(processedBuffer, remotePath);

        console.log(`🔗 URL pública: ${publicUrl}`);

        // Guardar en base de datos
        await query("INSERT INTO photos (id, image_url, description, year, album_id, file_size) VALUES (?, ?, ?, ?, ?, ?)", [
          fileId,
          publicUrl,
          description || null,
          year,
          albumId || null,
          processedBuffer.length,
        ]);

        console.log(`🎉 Foto guardada en DB: ${fileId}`);
        successCount++;
        uploadResults.push({
          fileName: file.name,
          success: true,
          photoId: fileId,
          publicUrl,
        });
      } catch (fileError) {
        console.error(`❌ Error procesando ${file.name}:`, fileError);
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: describeError(fileError),
        });
      }
    }

    console.log(`🎯 Resumen del upload: ${successCount}/${files.length} exitosos`);

    const firstError = uploadResults.find((r) => !r.success)?.error;

    return NextResponse.json(
      {
        success: successCount === files.length,
        uploaded: successCount,
        total: files.length,
        results: uploadResults,
        ...(successCount < files.length && { error: firstError }),
      },
      { status: successCount === 0 ? 500 : 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.error("❌ Error general en API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
