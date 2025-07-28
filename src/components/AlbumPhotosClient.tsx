"use client";
import { useState } from "react";
import { Photo } from "@/types";
import PhotoLightbox from "./PhotoLightbox";

interface AlbumPhotosClientProps {
  photos: Photo[];
}

export default function AlbumPhotosClient({ photos }: AlbumPhotosClientProps) {
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : prev));
  };

  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative group cursor-pointer" onClick={() => openLightbox(index)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.image_url} alt={photo.description || "Foto"} className="w-full h-32 object-cover rounded-lg group-hover:opacity-90 transition-opacity" />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity rounded-lg"></div>

            {/* Información de la foto */}
            {(photo.description || photo.year) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent text-white text-xs p-2 rounded-b-lg">
                {photo.description && <p className="truncate">{photo.description}</p>}
                {photo.year && <p>Año: {photo.year}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <PhotoLightbox photos={photos} currentIndex={lightboxIndex} isOpen={lightboxOpen} onClose={closeLightbox} onNext={nextPhoto} onPrev={prevPhoto} />
    </>
  );
}
