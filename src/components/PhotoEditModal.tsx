"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Photo, Album } from "@/types";

interface PhotoEditModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function PhotoEditModal({ photo, isOpen, onClose, onSave }: PhotoEditModalProps) {
  const [description, setDescription] = useState(photo.description || "");
  const [year, setYear] = useState(photo.year?.toString() || "");
  const [albumId, setAlbumId] = useState(photo.album_id || "");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAlbums();
      // Resetear valores cuando se abre el modal
      setDescription(photo.description || "");
      setYear(photo.year?.toString() || "");
      setAlbumId(photo.album_id || "");
    }
  }, [isOpen, photo]);

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase.from("albums").select("*").order("name");

      if (error) {
        console.error("Error fetching albums:", error);
        return;
      }

      setAlbums(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: Partial<Photo> = {
        description: description.trim() || undefined,
        year: year ? parseInt(year) : undefined,
        album_id: albumId || undefined,
      };

      const { error } = await supabase.from("photos").update(updates).eq("id", photo.id);

      if (error) {
        console.error("Error updating photo:", error);
        alert("Error al actualizar la foto");
        return;
      }

      console.log("✅ Foto actualizada exitosamente");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar la foto");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Editar Foto</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vista previa de la imagen */}
            <div>
              <h3 className="text-lg font-medium mb-3">Vista previa</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.image_url} alt={photo.description || "Foto"} className="w-full h-64 object-cover rounded-lg" />
            </div>

            {/* Formulario de edición */}
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descripción de la foto..."
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <input
                  type="number"
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2024"
                  min="1900"
                  max="2100"
                />
              </div>

              <div>
                <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-2">
                  Álbum
                </label>
                <select
                  id="album"
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin álbum</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Información del archivo</h4>
                <p className="text-xs text-gray-600">Tamaño: {photo.file_size ? `${(photo.file_size / 1024 / 1024).toFixed(2)} MB` : "N/A"}</p>
                <p className="text-xs text-gray-600">Subida: {new Date(photo.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
