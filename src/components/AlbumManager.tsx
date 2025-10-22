"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Album } from "@/types";

interface AlbumManagerProps {
  onAlbumCreated?: () => void;
}

export default function AlbumManager({ onAlbumCreated }: AlbumManagerProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAlbums();
      setAlbums(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAlbum = async () => {
    if (!newAlbumName.trim()) {
      alert("Por favor, ingresa un nombre para el álbum");
      return;
    }

    setCreating(true);
    try {
      const data = await apiClient.createAlbum({
        name: newAlbumName.trim(),
      });

      console.log("✅ Álbum creado:", data);
      setAlbums([...albums, data]);
      setNewAlbumName("");

      if (onAlbumCreated) {
        onAlbumCreated();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear el álbum");
    } finally {
      setCreating(false);
    }
  };

  const deleteAlbum = async (albumId: string, albumName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el álbum "${albumName}"? Las fotos no se eliminarán, solo se quitarán del álbum.`)) {
      return;
    }

    try {
      await apiClient.deleteAlbum(albumId);
      setAlbums(albums.filter((album) => album.id !== albumId));
      console.log("✅ Álbum eliminado");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar el álbum");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Gestión de Álbumes</h3>
      </div>

      {/* Crear nuevo álbum */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-lg font-medium text-gray-900 mb-3">Crear nuevo álbum</h4>
        <div className="flex gap-3">
          <input
            type="text"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
            placeholder="Nombre del álbum..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === "Enter" && createAlbum()}
          />
          <button onClick={createAlbum} disabled={creating || !newAlbumName.trim()} className="px-4 py-2 bg-[#354564] text-white rounded-lg hover:bg-[#6DBCB9] transition-colors disabled:opacity-50">
            {creating ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>

      {/* Lista de álbumes */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-900">Álbumes existentes ({albums.length})</h4>

        {loading ? (
          <div className="text-center py-4">
            <div className="text-gray-600">Cargando álbumes...</div>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-2">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p>No hay álbumes creados aún</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => (
              <div key={album.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{album.name}</h5>
                    <p className="text-sm text-gray-500">Creado: {new Date(album.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteAlbum(album.id, album.name)} className="text-red-500 hover:text-red-700 p-1" title="Eliminar álbum">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
