"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Photo, Album } from "@/types";
import PhotoLightbox from "./PhotoLightbox";

interface AlbumWithPhotos extends Album {
  photos: Photo[];
}

export default function HomeAlbumGallery() {
  const [albumsWithPhotos, setAlbumsWithPhotos] = useState<AlbumWithPhotos[]>([]);
  const [unassignedPhotos, setUnassignedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetchAlbumsAndPhotos();
  }, []);

  const fetchAlbumsAndPhotos = async () => {
    try {
      setLoading(true);

      // Obtener álbumes
      const { data: albums, error: albumsError } = await supabase.from("albums").select("*").order("created_at", { ascending: false });

      if (albumsError) throw albumsError;

      // Obtener fotos sin álbum
      const { data: unassigned, error: unassignedError } = await supabase.from("photos").select("*").is("album_id", null).order("created_at", { ascending: false });

      if (unassignedError) throw unassignedError;
      setUnassignedPhotos(unassigned || []);

      // Obtener fotos para cada álbum
      const albumsWithPhotosData: AlbumWithPhotos[] = [];

      for (const album of albums || []) {
        const { data: photos, error: photosError } = await supabase.from("photos").select("*").eq("album_id", album.id).order("created_at", { ascending: false });

        if (!photosError && photos && photos.length > 0) {
          albumsWithPhotosData.push({
            ...album,
            photos: photos,
          });
        }
      }

      setAlbumsWithPhotos(albumsWithPhotosData);
    } catch (error) {
      console.error("Error fetching albums and photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (photos: Photo[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev < lightboxPhotos.length - 1 ? prev + 1 : prev));
  };

  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const scrollToAlbum = (albumId: string) => {
    const element = document.getElementById(`album-${albumId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToUnassigned = () => {
    const element = document.getElementById("unassigned-photos");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="h-32 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">📸 Visor de Fotos</h1>
        <p className="text-lg text-gray-600 mb-8">Galería de fotos organizada por álbumes</p>
      </header>

      {/* Navegación rápida */}
      {(albumsWithPhotos.length > 0 || unassignedPhotos.length > 0) && (
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ir a:</h3>
          <div className="flex flex-wrap gap-2">
            {unassignedPhotos.length > 0 && (
              <button onClick={scrollToUnassigned} className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg hover:bg-yellow-200 transition-colors text-sm">
                📝 Sin álbum ({unassignedPhotos.length})
              </button>
            )}
            {albumsWithPhotos.map((album) => (
              <button key={album.id} onClick={() => scrollToAlbum(album.id)} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                📁 {album.name} ({album.photos.length})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* Fotos sin álbum */}
        {unassignedPhotos.length > 0 && (
          <section id="unassigned-photos" className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              📝 Sin álbum
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {unassignedPhotos.length} foto{unassignedPhotos.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {unassignedPhotos.map((photo, index) => (
                <div key={photo.id} className="relative group cursor-pointer" onClick={() => openLightbox(unassignedPhotos, index)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.image_url} alt={photo.description || "Foto"} className="w-full h-32 object-cover rounded-lg group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity rounded-lg"></div>
                  {photo.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent text-white text-xs p-2 rounded-b-lg">
                      <p className="truncate">{photo.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Álbumes con fotos */}
        {albumsWithPhotos.map((album) => (
          <section key={album.id} id={`album-${album.id}`} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                📁 {album.name}
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {album.photos.length} foto{album.photos.length !== 1 ? "s" : ""}
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/albums/${album.id}`);
                    alert("¡Enlace copiado al portapapeles!");
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Copiar enlace del álbum"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <Link href={`/albums/${album.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Ver álbum completo
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {album.photos.map((photo, index) => (
                <div key={photo.id} className="relative group cursor-pointer" onClick={() => openLightbox(album.photos, index)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.image_url} alt={photo.description || "Foto"} className="w-full h-32 object-cover rounded-lg group-hover:opacity-90 transition-opacity" />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity rounded-lg"></div>
                  {photo.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent text-white text-xs p-2 rounded-b-lg">
                      <p className="truncate">{photo.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Mensaje cuando no hay contenido */}
        {albumsWithPhotos.length === 0 && unassignedPhotos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-gray-400 text-6xl mb-4">📷</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay fotos aún</h3>
            <p className="text-gray-500">Ve al panel de administración para subir las primeras fotos</p>
            <div className="mt-4">
              <a href="/admin" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Ir al panel de administración
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <PhotoLightbox photos={lightboxPhotos} currentIndex={lightboxIndex} isOpen={lightboxOpen} onClose={closeLightbox} onNext={nextPhoto} onPrev={prevPhoto} />
    </div>
  );
}
