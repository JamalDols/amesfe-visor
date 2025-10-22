/**
 * Script para exportar datos e imágenes de Supabase
 * Ejecutar: npx tsx scripts/export-from-supabase.ts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

// Cargar variables de entorno desde .env.local
config({ path: path.join(process.cwd(), ".env.local") });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan variables de entorno de Supabase");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Directorio de exportación
const EXPORT_DIR = path.join(process.cwd(), "export-supabase");
const IMAGES_DIR = path.join(EXPORT_DIR, "images");

/**
 * Descarga una imagen desde una URL
 */
async function downloadImage(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const filePath = path.join(IMAGES_DIR, filename);

    const file = fs.createWriteStream(filePath);
    protocol
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
  });
}

/**
 * Exporta todos los datos e imágenes
 */
async function exportData() {
  try {
    console.log("🚀 Iniciando exportación de Supabase...\n");

    // Crear directorios
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    // 1. Exportar álbumes
    console.log("📁 Exportando álbumes...");
    const { data: albums, error: albumsError } = await supabase.from("albums").select("*").order("created_at");

    if (albumsError) {
      throw albumsError;
    }

    console.log(`✅ ${albums?.length || 0} álbumes exportados`);

    // 2. Exportar fotos (metadatos)
    console.log("\n📸 Exportando metadatos de fotos...");
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select(
        `
      *,
      albums (
        id,
        name
      )
    `
      )
      .order("created_at");

    if (photosError) {
      throw photosError;
    }

    console.log(`✅ ${photos?.length || 0} fotos encontradas`);

    // 3. Descargar imágenes
    console.log("\n💾 Descargando imágenes...");
    let downloadedCount = 0;
    let errorCount = 0;

    for (const photo of photos || []) {
      try {
        const url = photo.image_url;
        // Extraer el nombre del archivo de la URL
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1];

        console.log(`  📥 Descargando: ${filename}`);
        await downloadImage(url, filename);

        // Guardar el filename en el objeto photo para referencia
        photo.local_filename = filename;
        downloadedCount++;
      } catch (error) {
        console.error(`  ❌ Error descargando ${photo.image_url}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Descargadas: ${downloadedCount}/${photos?.length || 0} imágenes`);
    if (errorCount > 0) {
      console.log(`⚠️  Errores: ${errorCount}`);
    }

    // 4. Guardar datos en JSON
    const exportData = {
      exported_at: new Date().toISOString(),
      albums: albums || [],
      photos: photos || [],
      summary: {
        total_albums: albums?.length || 0,
        total_photos: photos?.length || 0,
        downloaded_images: downloadedCount,
        failed_downloads: errorCount,
      },
    };

    const dataPath = path.join(EXPORT_DIR, "export-data.json");
    fs.writeFileSync(dataPath, JSON.stringify(exportData, null, 2));

    console.log(`\n💾 Datos guardados en: ${dataPath}`);
    console.log(`📁 Imágenes guardadas en: ${IMAGES_DIR}`);

    console.log("\n✅ ¡Exportación completada exitosamente!");
    console.log("\n📊 Resumen:");
    console.log(`   Álbumes: ${exportData.summary.total_albums}`);
    console.log(`   Fotos: ${exportData.summary.total_photos}`);
    console.log(`   Imágenes descargadas: ${exportData.summary.downloaded_images}`);
  } catch (error) {
    console.error("\n❌ Error durante la exportación:", error);
    process.exit(1);
  }
}

// Ejecutar exportación
exportData();
