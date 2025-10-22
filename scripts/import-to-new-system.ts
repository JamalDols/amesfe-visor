/**
 * Script para importar datos e imágenes al nuevo sistema (MySQL + FTP)
 * Ejecutar: npx tsx scripts/import-to-new-system.ts
 */

import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Cargar variables de entorno desde .env.local
config({ path: path.join(process.cwd(), ".env.local") });

import { query } from "../src/lib/db";
import { uploadFile } from "../src/lib/ftp";
import sharp from "sharp";

// Directorio de importación
const EXPORT_DIR = path.join(process.cwd(), "export-supabase");
const IMAGES_DIR = path.join(EXPORT_DIR, "images");
const DATA_FILE = path.join(EXPORT_DIR, "export-data.json");

interface ExportedPhoto {
  id: string;
  image_url: string;
  description: string | null;
  year: number | null;
  album_id: string | null;
  file_size: number | null;
  created_at: string;
  local_filename?: string;
}

interface ExportedAlbum {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface ExportData {
  albums: ExportedAlbum[];
  photos: ExportedPhoto[];
}

/**
 * Procesa una imagen (igual que en upload)
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

/**
 * Importa todos los datos e imágenes
 */
async function importData() {
  try {
    console.log("🚀 Iniciando importación al nuevo sistema...\n");

    // Verificar que existe el archivo de datos
    if (!fs.existsSync(DATA_FILE)) {
      console.error(`❌ No se encontró el archivo de datos: ${DATA_FILE}`);
      console.log("   Primero ejecuta: npx tsx scripts/export-from-supabase.ts");
      process.exit(1);
    }

    // Leer datos exportados
    const exportData: ExportData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

    console.log("📊 Datos a importar:");
    console.log(`   Álbumes: ${exportData.albums.length}`);
    console.log(`   Fotos: ${exportData.photos.length}\n`);

    // 1. Importar álbumes
    console.log("📁 Importando álbumes...");
    let albumsImported = 0;

    for (const album of exportData.albums) {
      try {
        await query("INSERT INTO albums (id, name, description, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)", [
          album.id,
          album.name,
          album.description || null,
          album.created_at,
        ]);
        console.log(`   ✅ ${album.name}`);
        albumsImported++;
      } catch (error) {
        console.error(`   ❌ Error importando álbum ${album.name}:`, error);
      }
    }

    console.log(`\n✅ ${albumsImported}/${exportData.albums.length} álbumes importados\n`);

    // 2. Importar fotos
    console.log("📸 Importando fotos...");
    let photosImported = 0;
    let photosFailed = 0;

    for (let i = 0; i < exportData.photos.length; i++) {
      const photo = exportData.photos[i];
      const progress = `[${i + 1}/${exportData.photos.length}]`;

      try {
        console.log(`\n${progress} Procesando: ${photo.local_filename || photo.id}`);

        // Leer imagen local
        const imagePath = path.join(IMAGES_DIR, photo.local_filename || "");
        if (!fs.existsSync(imagePath)) {
          console.log(`   ⚠️  Imagen no encontrada, saltando...`);
          photosFailed++;
          continue;
        }

        const imageBuffer = fs.readFileSync(imagePath);

        // Procesar imagen (redimensionar y convertir a WebP si no lo es ya)
        console.log(`   🔄 Procesando imagen...`);
        const processedBuffer = await processImage(imageBuffer);

        // Subir al FTP
        const filename = photo.local_filename || `${photo.id}.webp`;
        const remotePath = `/web/wp-content/uploads/fotosvisor/${filename}`;

        console.log(`   📤 Subiendo a FTP...`);
        const publicUrl = await uploadFile(processedBuffer, remotePath);

        console.log(`   🔗 URL: ${publicUrl}`);

        // Guardar en base de datos
        await query(
          "INSERT INTO photos (id, image_url, description, year, album_id, file_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE image_url = VALUES(image_url), description = VALUES(description), year = VALUES(year), album_id = VALUES(album_id), file_size = VALUES(file_size)",
          [photo.id, publicUrl, photo.description || null, photo.year || null, photo.album_id || null, processedBuffer.length, photo.created_at]
        );

        console.log(`   ✅ Importada correctamente`);
        photosImported++;
      } catch (error) {
        console.error(`   ❌ Error importando foto:`, error);
        photosFailed++;
      }
    }

    console.log(`\n\n✅ ¡Importación completada!`);
    console.log(`\n📊 Resumen final:`);
    console.log(`   Álbumes importados: ${albumsImported}/${exportData.albums.length}`);
    console.log(`   Fotos importadas: ${photosImported}/${exportData.photos.length}`);
    console.log(`   Fotos fallidas: ${photosFailed}`);
  } catch (error) {
    console.error("\n❌ Error durante la importación:", error);
    process.exit(1);
  }
}

// Ejecutar importación
importData();
