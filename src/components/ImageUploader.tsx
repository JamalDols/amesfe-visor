"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { apiClient, Album } from "@/lib/api-client";

type ImageStatus = "pending" | "compressing" | "uploading" | "done" | "error";

interface SelectedImage {
  id: string;
  file: File;
  preview: string;
  status: ImageStatus;
  error?: string;
}

interface ImageUploaderProps {
  onUploadSuccess?: () => void;
}

const CONCURRENCY = 3;

const compressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2000,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.9,
};

async function sendFile(file: File, albumId: string): Promise<void> {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("descriptions", "");
  formData.append("years", "");
  if (albumId) formData.append("albumId", albumId);

  let response: Response;
  try {
    response = await fetch("/api/upload", { method: "POST", body: formData });
  } catch {
    throw new Error("Sin conexión con el servidor. Comprueba tu internet.");
  }

  let data: { error?: string; details?: string; results?: { success: boolean; error?: string }[] } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  if (response.status === 413) throw new Error("La imagen es demasiado grande para el servidor.");

  const fileResult = data?.results?.[0];
  if (!response.ok || (fileResult && !fileResult.success)) {
    throw new Error(fileResult?.error || data?.details || data?.error || `Error del servidor (${response.status})`);
  }
}

export default function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getAlbums()
      .then(setAlbums)
      .catch(() => setNotice("No se pudieron cargar los álbumes. Las fotos se subirán sin álbum."));
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setNotice(null);
    const newImages: SelectedImage[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const onDropRejected = useCallback((rejections: { file: File }[]) => {
    setNotice(`${rejections.length} archivo(s) ignorados: solo se admiten JPG, PNG, WebP y GIF.`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    multiple: true,
    disabled: uploading,
  });

  const updateImage = (id: string, patch: Partial<SelectedImage>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const clearFinished = () => {
    setImages((prev) => {
      prev.filter((img) => img.status === "done").forEach((img) => URL.revokeObjectURL(img.preview));
      return prev.filter((img) => img.status !== "done");
    });
  };

  const processImage = async (image: SelectedImage, targetAlbumId: string): Promise<boolean> => {
    try {
      updateImage(image.id, { status: "compressing", error: undefined });
      let fileToSend: File = image.file;
      try {
        fileToSend = await imageCompression(image.file, compressionOptions);
      } catch {
        fileToSend = image.file;
      }

      updateImage(image.id, { status: "uploading" });
      await sendFile(fileToSend, targetAlbumId);
      updateImage(image.id, { status: "done" });
      return true;
    } catch (error) {
      updateImage(image.id, { status: "error", error: error instanceof Error ? error.message : "Error desconocido" });
      return false;
    }
  };

  const handleUpload = async () => {
    const queue = images.filter((img) => img.status === "pending" || img.status === "error");
    if (queue.length === 0) return;

    setUploading(true);
    setNotice(null);

    let cursor = 0;
    let uploaded = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const image = queue[cursor++];
        if (await processImage(image, albumId)) uploaded++;
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

    setUploading(false);
    if (uploaded > 0) onUploadSuccess?.();
  };

  const total = images.length;
  const done = images.filter((img) => img.status === "done").length;
  const failed = images.filter((img) => img.status === "error").length;
  const toUpload = images.filter((img) => img.status === "pending" || img.status === "error").length;
  const percent = total > 0 ? Math.round(((done + failed) / total) * 100) : 0;
  const albumName = albums.find((a) => a.id === albumId)?.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label htmlFor="upload-album" className="text-sm font-medium text-gray-700">
          Subir al álbum:
        </label>
        <select
          id="upload-album"
          value={albumId}
          onChange={(e) => setAlbumId(e.target.value)}
          disabled={uploading}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Sin álbum</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.name}
            </option>
          ))}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-lg text-gray-600">{isDragActive ? "Suelta las imágenes aquí" : "Arrastra imágenes aquí o haz clic para seleccionar"}</p>
          <p className="text-sm text-gray-500">Soporta: JPG, PNG, WebP, GIF. Puedes añadir muchas a la vez.</p>
        </div>
      </div>

      {notice && <div className="rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3">{notice}</div>}

      {total > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-lg font-medium">
              Imágenes ({total}){albumName ? ` → ${albumName}` : ""}
            </h3>
            <div className="flex gap-2">
              {done > 0 && !uploading && (
                <button onClick={clearFinished} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  Limpiar subidas
                </button>
              )}
              <button
                onClick={handleUpload}
                disabled={uploading || toUpload === 0}
                className="bg-[#354564] text-white px-4 py-2 rounded-lg hover:bg-[#6DBCB9] transition-colors disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : failed > 0 && toUpload === failed ? `Reintentar ${failed} fallida(s)` : `Subir ${toUpload} imagen(es)`}
              </button>
            </div>
          </div>

          {(uploading || done > 0 || failed > 0) && (
            <div className="space-y-2" aria-live="polite">
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#6DBCB9] transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-sm text-gray-600">
                {uploading ? `Subiendo… ${done + failed} de ${total} (${percent}%)` : `${done} subida(s) correctamente`}
                {failed > 0 && <span className="text-red-600 font-medium"> · {failed} con error</span>}
              </p>
            </div>
          )}

          {failed > 0 && !uploading && (
            <ul className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
              {images
                .filter((img) => img.status === "error")
                .map((img) => (
                  <li key={img.id}>
                    <span className="font-medium">{img.file.name}:</span> {img.error}
                  </li>
                ))}
            </ul>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.preview}
                  alt={image.file.name}
                  className={`w-full h-24 object-cover rounded-lg ${image.status === "error" ? "ring-2 ring-red-500" : ""} ${image.status === "done" ? "opacity-60" : ""}`}
                />
                {!uploading && image.status !== "done" && (
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Quitar ${image.file.name}`}
                  >
                    ×
                  </button>
                )}
                <StatusBadge status={image.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ImageStatus }) {
  if (status === "pending") return null;
  const styles: Record<Exclude<ImageStatus, "pending">, { label: string; className: string }> = {
    compressing: { label: "Comprimiendo…", className: "bg-blue-500" },
    uploading: { label: "Subiendo…", className: "bg-blue-500" },
    done: { label: "✓ Subida", className: "bg-green-600" },
    error: { label: "✕ Error", className: "bg-red-600" },
  };
  const { label, className } = styles[status];
  return <div className={`absolute bottom-1 left-1 text-white text-xs px-1.5 py-0.5 rounded ${className}`}>{label}</div>;
}
