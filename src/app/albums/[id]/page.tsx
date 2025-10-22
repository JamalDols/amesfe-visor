"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AlbumPhotosClient from "@/components/AlbumPhotosClient";
import { apiClient } from "@/lib/api-client";
import { Album, Photo } from "@/types";

export default function AlbumPage() {
  const params = useParams();
  const id = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtener álbum
        const albumData = await apiClient.getAlbum(id);
        setAlbum(albumData);

        // Obtener fotos del álbum
        const photosData = await apiClient.getPhotos({ album_id: id });
        setPhotos(photosData);
      } catch (err) {
        console.error("Error fetching album:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Álbum no encontrado</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a inicio
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-bold text-gray-900">📁 {album.name}</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/admin" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del álbum */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">📁 {album.name}</h2>
            <p className="text-gray-600">
              {photos.length} foto{photos.length !== 1 ? "s" : ""} en este álbum
            </p>
          </div>

          {photos.length > 0 ? (
            <AlbumPhotosClient photos={photos} />
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📷</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Este álbum está vacío</h3>
              <p className="text-gray-500">Aún no hay fotos en este álbum</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
