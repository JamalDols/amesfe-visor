"use client";
import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Photo } from "@/types";
import PhotoEditModal from "./PhotoEditModal";

interface Album {
  id: string;
  name: string;
}

interface PhotoGalleryProps {
  refreshTrigger: number;
  showUnassigned?: boolean;
}

export default function PhotoGallery({ refreshTrigger, showUnassigned = false }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  // Estados para selección múltiple
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔄 Buscando fotos en la base de datos...");

      // Obtener fotos según el filtro
      const photos = showUnassigned ? await apiClient.getPhotos({ unassigned: true }) : await apiClient.getPhotos();

      console.log(`✅ ${photos.length} fotos encontradas`);
      setPhotos(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  }, [showUnassigned]);

  // Función para cargar álbumes
  const fetchAlbums = useCallback(async () => {
    try {
      const albums = await apiClient.getAlbums();
      setAlbums(albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  }, []);

  // Funciones para selección múltiple
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(photoId)) {
        newSelection.delete(photoId);
      } else {
        newSelection.add(photoId);
      }
      return newSelection;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map((photo) => photo.id)));
  };

  const clearSelection = () => {
    setSelectedPhotos(new Set());
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearSelection();
    }
  };

  // Función para mover fotos seleccionadas a un álbum
  const movePhotosToAlbum = async (albumId: string | null) => {
    if (selectedPhotos.size === 0) return;

    try {
      const photoIds = Array.from(selectedPhotos);

      // Actualizar cada foto con el nuevo album_id
      await apiClient.updatePhotosAlbum(photoIds, albumId);

      console.log(`✅ ${photoIds.length} fotos movidas al álbum`);

      // Refrescar datos
      await fetchPhotos();
      clearSelection();
      setShowMoveModal(false);

      alert(`${photoIds.length} fotos movidas correctamente`);
    } catch (error) {
      console.error("Error moviendo fotos:", error);
      alert("Error al mover las fotos");
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
  }, [fetchPhotos, fetchAlbums, refreshTrigger]);

  async function deletePhoto(photoId: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
      return;
    }

    try {
      console.log("🗑️ Eliminando foto:", photoId);

      // Eliminar usando la API (que borra tanto de FTP como de DB)
      await apiClient.deletePhoto(photoId);

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
        <div className="flex gap-3">
          <button
            onClick={toggleSelectionMode}
            className={`px-4 py-2 rounded-lg transition-colors ${isSelectionMode ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            {isSelectionMode ? "Cancelar Selección" : "Seleccionar Fotos"}
          </button>
          <button onClick={fetchPhotos} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Actualizar
          </button>
        </div>
      </div>

      {/* Barra de herramientas de selección */}
      {isSelectionMode && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-blue-800 font-medium">{selectedPhotos.size} foto(s) seleccionada(s)</span>
              <button onClick={selectAllPhotos} className="text-blue-600 hover:text-blue-800 underline text-sm">
                Seleccionar todas
              </button>
              <button onClick={clearSelection} className="text-blue-600 hover:text-blue-800 underline text-sm">
                Limpiar selección
              </button>
            </div>

            {selectedPhotos.size > 0 && (
              <button onClick={() => setShowMoveModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                Mover a Álbum
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            {/* Checkbox de selección */}
            {isSelectionMode && (
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedPhotos.has(photo.id)}
                  onChange={() => togglePhotoSelection(photo.id)}
                  className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.image_url}
              alt={photo.description || "Foto"}
              className={`w-full h-32 object-cover rounded-lg transition-all ${
                isSelectionMode ? "cursor-pointer hover:opacity-80" + (selectedPhotos.has(photo.id) ? " ring-4 ring-blue-500" : "") : ""
              }`}
              onClick={() => (isSelectionMode ? togglePhotoSelection(photo.id) : undefined)}
              onError={(e) => {
                console.error("Error cargando imagen:", photo.image_url);
                (e.target as HTMLImageElement).style.backgroundColor = "#f3f4f6";
                (e.target as HTMLImageElement).alt = "Error al cargar";
              }}
              onLoad={() => {
                console.log("✅ Imagen cargada:", photo.image_url);
              }}
            />

            {/* Overlay con botones - solo visible si no estamos en modo selección */}
            {!isSelectionMode && (
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
                  <button onClick={() => deletePhoto(photo.id)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600" title="Eliminar foto">
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
            )}

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

      {/* Modal para mover fotos a álbum */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Mover {selectedPhotos.size} foto(s) a álbum</h3>

            <div className="space-y-3 mb-6">
              {/* Opción para quitar de álbum */}
              <button onClick={() => movePhotosToAlbum(null)} className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Sin álbum</div>
                <div className="text-sm text-gray-500">Quitar de cualquier álbum</div>
              </button>

              {/* Lista de álbumes */}
              {albums.map((album) => (
                <button key={album.id} onClick={() => movePhotosToAlbum(album.id)} className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <div className="font-medium">{album.name}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowMoveModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
