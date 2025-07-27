import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando upload de imágenes...");

    const supabase = await createServerSupabaseClient();

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("🔐 Verificando autenticación:", !!session);

    if (!session) {
      console.error("❌ No hay sesión activa");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const albumId = formData.get("albumId") as string | null;
    const descriptions = formData.getAll("descriptions") as string[];
    const years = formData.getAll("years") as string[];

    console.log("📁 Archivos recibidos:", files.length);
    console.log(
      "📝 Detalles de archivos:",
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

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

      console.log(`📸 Procesando archivo ${i + 1}/${files.length}:`, {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
      });

      // Generar nombre único para el archivo - forzar webp
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
      const filePath = `photos/${fileName}`;

      console.log(`💾 Subiendo como: ${filePath}`);

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from("photos").upload(filePath, file, {
        contentType: "image/webp", // Forzar WebP
        upsert: false,
      });

      if (uploadError) {
        console.error(`❌ Error subiendo ${file.name}:`, uploadError);
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: uploadError.message,
        });
        continue;
      }

      console.log(`✅ Archivo subido exitosamente:`, uploadData);

      // Obtener URL pública del archivo
      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(filePath);

      console.log(`🔗 URL pública generada:`, publicUrl);

      // Guardar metadatos en la base de datos
      const { data: photoData, error: dbError } = await supabase
        .from("photos")
        .insert({
          image_url: publicUrl,
          description: description || null,
          year: year,
          album_id: albumId || null,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) {
        console.error(`❌ Error en base de datos para ${file.name}:`, dbError);
        // Si falla la DB, eliminar el archivo subido
        await supabase.storage.from("photos").remove([filePath]);
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: `Database error: ${dbError.message}`,
        });
        continue;
      }

      console.log(`🎉 Foto guardada en DB:`, photoData);
      successCount++;
      uploadResults.push({
        fileName: file.name,
        success: true,
        photoId: photoData.id,
        publicUrl,
      });
    }

    console.log(`🎯 Resumen del upload: ${successCount}/${files.length} exitosos`);

    return NextResponse.json({
      success: true,
      uploaded: successCount,
      total: files.length,
      results: uploadResults,
    });
  } catch (error) {
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
