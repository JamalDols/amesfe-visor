"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Photo } from "@/types";
import PhotoEditModal from "./PhotoEditModal";

interface PhotoGalleryProps {
  refreshTrigger: number;
  showUnassigned?: boolean;
}

export default function PhotoGallery({ refreshTrigger, showUnassigned = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Buscando fotos en la base de datos...");

      let query = supabase
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
        .order("created_at", { ascending: false });

      // Si queremos solo fotos sin álbum
      if (showUnassigned) {
        query = query.is("album_id", null);
      }

      const { data: photos, error } = await query;

      if (error) {
        console.error("❌ Error al buscar fotos:", error);
        throw error;
      }

      console.log(`✅ ${photos?.length || 0} fotos encontradas`);
      setPhotos(photos || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  }, [showUnassigned]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos, refreshTrigger]);

  async function deletePhoto(photoId: string, imageUrl: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
      return;
    }

    try {
      console.log("🗑️ Eliminando foto:", photoId);

      // Extraer el path del archivo de la URL
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Eliminar el archivo del storage
      const { error: storageError } = await supabase.storage.from("photos").remove([fileName]);

      if (storageError) {
        console.error("Error eliminando archivo del storage:", storageError);
      }

      // Eliminar registro de la base de datos
      const { error: dbError } = await supabase.from("photos").delete().eq("id", photoId);

      if (dbError) {
        console.error("Error eliminando registro de la DB:", dbError);
        throw dbError;
      }

      console.log("✅ Foto eliminada correctamente");
      fetchPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Error al eliminar la foto");
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {showUnassigned ? "Fotos sin álbum" : "Fotos Subidas"} ({photos.length})
        </h2>
        <button onClick={fetchPhotos} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.image_url}
              alt={photo.description || "Foto"}
              className="w-full h-32 object-cover rounded-lg"
              onError={(e) => {
                console.error("Error cargando imagen:", photo.image_url);
                (e.target as HTMLImageElement).style.backgroundColor = "#f3f4f6";
                (e.target as HTMLImageElement).alt = "Error al cargar";
              }}
              onLoad={() => {
                console.log("✅ Imagen cargada:", photo.image_url);
              }}
            />

            {/* Overlay con botones */}
            <div className="absolute inset-0 group-hover:bg-black/10 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingPhoto(photo)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-[#354564]" title="Editar foto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button onClick={() => deletePhoto(photo.id, photo.image_url)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600" title="Eliminar foto">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Información de la foto */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent text-white text-xs p-2 rounded-b-lg">
              {photo.description && <p className="truncate">{photo.description}</p>}
              {photo.year && <p>Año: {photo.year}</p>}
              {photo.albums?.name && <p>Álbum: {photo.albums.name}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edición */}
      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={() => {
            setEditingPhoto(null);
            fetchPhotos();
          }}
        />
      )}
    </div>
  );
}
