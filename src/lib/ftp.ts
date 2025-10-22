import { Client } from "basic-ftp";
import { Readable } from "stream";

/**
 * Crea un cliente FTP conectado
 */
export async function createFTPClient(): Promise<Client> {
  // Configuración FTP (leer aquí para asegurar que las variables están cargadas)
  const ftpConfig = {
    host: process.env.FTP_HOST || "ftp.amesfe.org",
    user: process.env.FTP_USER || "amesfede19",
    password: process.env.FTP_PASSWORD,
    secure: false,
  };

  console.log("🔗 Intentando conectar a FTP:", ftpConfig.host);

  const client = new Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    await client.access(ftpConfig);
    console.log("✅ FTP Connected successfully");
    return client;
  } catch (error) {
    console.error("❌ FTP connection error:", error);
    throw new Error("No se pudo conectar al servidor FTP");
  }
}

/**
 * Sube un archivo al FTP desde un buffer
 */
export async function uploadFile(buffer: Buffer, remotePath: string): Promise<string> {
  const client = await createFTPClient();

  try {
    // Crear directorios si no existen
    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf("/"));
    if (remoteDir) {
      await client.ensureDir(remoteDir);
    }

    // Subir archivo
    const readable = Readable.from(buffer);
    await client.uploadFrom(readable, remotePath);

    // Construir URL pública (quitar /web/ del inicio si existe)
    const publicPath = remotePath.replace(/^\/web\//, "/");
    const publicUrl = `https://amesfe.org${publicPath}`;

    return publicUrl;
  } catch (error) {
    console.error("FTP upload error:", error);
    throw new Error("Error al subir archivo al FTP");
  } finally {
    client.close();
  }
}

/**
 * Elimina un archivo del FTP
 */
export async function deleteFile(remotePath: string): Promise<void> {
  const client = await createFTPClient();

  try {
    await client.remove(remotePath);
  } catch (error) {
    console.error("FTP delete error:", error);
    throw new Error("Error al eliminar archivo del FTP");
  } finally {
    client.close();
  }
}

/**
 * Extrae la ruta relativa del FTP desde una URL completa
 */
export function getRemotePathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
}
