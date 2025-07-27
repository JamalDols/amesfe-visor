"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";

interface SelectedImage {
  file: File;
  preview: string;
  compressed?: File;
}

interface ImageUploaderProps {
  onUploadSuccess?: () => void;
}

export default function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const compressImages = useCallback(async () => {
    if (selectedImages.length === 0) return;

    setCompressing(true);
    const compressionOptions = {
      maxSizeMB: 2, // Aumentamos el tamaño máximo
      maxWidthOrHeight: 2000, // 2000px como solicitaste
      useWebWorker: true,
      fileType: "image/webp" as const, // Forzar WebP
      initialQuality: 0.9, // Alta calidad
    };

    try {
      console.log("🖼️ Comprimiendo", selectedImages.length, "imágenes...");

      const compressedImages = await Promise.all(
        selectedImages.map(async (img, index) => {
          if (img.compressed) return img;

          console.log(`📸 Comprimiendo imagen ${index + 1}:`, {
            original: img.file.name,
            size: `${(img.file.size / 1024 / 1024).toFixed(2)}MB`,
            type: img.file.type,
          });

          const compressedFile = await imageCompression(img.file, compressionOptions);

          console.log(`✅ Imagen ${index + 1} comprimida:`, {
            newSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
            type: compressedFile.type,
            name: compressedFile.name,
          });

          return {
            ...img,
            compressed: compressedFile,
          };
        })
      );

      setSelectedImages(compressedImages);
      console.log("🎉 Todas las imágenes comprimidas exitosamente");
    } catch (error) {
      console.error("❌ Error compressing images:", error);
    } finally {
      setCompressing(false);
    }
  }, [selectedImages]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter((file) => file.type.startsWith("image/"));

    const newImages: SelectedImage[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    // Actualizar estado con las nuevas imágenes
    setSelectedImages((prev) => {
      const updated = [...prev, ...newImages];
      return updated;
    });

    // Auto-comprimir después de que el estado se actualice
    setTimeout(async () => {
      console.log("🚀 Iniciando auto-compresión de", newImages.length, "nuevas imágenes...");

      // Solo comprimir las nuevas imágenes, no todas
      await autoCompressImages(newImages);
    }, 100);
  }, []);

  // Función separada para auto-comprimir que no depende del estado
  const autoCompressImages = async (imagesToCompress: SelectedImage[]) => {
    if (imagesToCompress.length === 0) return;

    setCompressing(true);
    const compressionOptions = {
      maxSizeMB: 2,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      fileType: "image/webp" as const,
      initialQuality: 0.9,
    };

    try {
      console.log("🖼️ Auto-comprimiendo", imagesToCompress.length, "imágenes...");

      const compressedImages = await Promise.all(
        imagesToCompress.map(async (img, index) => {
          if (img.compressed) return img;

          console.log(`📸 Comprimiendo imagen ${index + 1}:`, {
            original: img.file.name,
            size: `${(img.file.size / 1024 / 1024).toFixed(2)}MB`,
            type: img.file.type,
          });

          const compressedFile = await imageCompression(img.file, compressionOptions);

          console.log(`✅ Imagen ${index + 1} comprimida:`, {
            newSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
            type: compressedFile.type,
            name: compressedFile.name,
          });

          return {
            ...img,
            compressed: compressedFile,
          };
        })
      );

      setSelectedImages(compressedImages);
      console.log("🎉 Auto-compresión completada exitosamente");
    } catch (error) {
      console.error("❌ Error en auto-compresión:", error);
    } finally {
      setCompressing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    multiple: true,
  });

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      alert("No hay imágenes para subir");
      return;
    }

    console.log("🚀 Iniciando upload de", selectedImages.length, "imágenes...");

    setUploading(true);
    try {
      const formData = new FormData();

      // Agregar archivos (usar compressed si está disponible, sino el original)
      selectedImages.forEach((image, index) => {
        const fileToUpload = image.compressed || image.file;
        console.log(`📁 Agregando archivo ${index + 1}:`, {
          name: fileToUpload.name,
          size: `${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`,
          type: fileToUpload.type,
          isCompressed: !!image.compressed,
        });

        formData.append("files", fileToUpload);
        formData.append("descriptions", ""); // Por ahora sin descripción
        formData.append("years", ""); // Por ahora sin año
      });

      console.log("📤 Enviando request a /api/upload...");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("📥 Response status:", response.status);

      const result = await response.json();
      console.log("📋 Response data:", result);

      if (result.success) {
        console.log("🎉 Upload exitoso!");
        alert(`¡Éxito! Se subieron ${result.uploaded} de ${result.total} imágenes`);
        // Limpiar las imágenes seleccionadas
        selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
        setSelectedImages([]);

        // Llamar al callback para refrescar la galería y estadísticas
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        console.error("❌ Upload falló:", result);
        alert(`Error al subir imágenes: ${result.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("❌ Error uploading images:", error);
      alert("Error al subir las imágenes: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
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
          <p className="text-sm text-gray-500">Soporta: JPG, PNG, WebP, GIF</p>
        </div>
      </div>

      {/* Imágenes seleccionadas */}
      {selectedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Imágenes seleccionadas ({selectedImages.length})</h3>
            <div className="flex gap-2">
              <button onClick={compressImages} disabled={compressing} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50">
                {compressing ? "Comprimiendo..." : "Comprimir a WebP"}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedImages.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : "Subir Imágenes"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                {image.compressed && <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">WebP</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
