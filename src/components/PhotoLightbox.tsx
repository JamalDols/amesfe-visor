"use client";
import { useEffect } from "react";
import { Photo } from "@/types";

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PhotoLightbox({ photos, currentIndex, isOpen, onClose, onNext, onPrev }: PhotoLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrev();
          break;
        case "ArrowRight":
          onNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Prevenir scroll del body cuando el lightbox está abierto
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !photos[currentIndex]) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Overlay para cerrar */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Contenido del lightbox */}
      <div className="relative max-w-7xl max-h-full mx-4 flex flex-col">
        {/* Header con contador y botón cerrar */}
        <div className="flex justify-between items-center text-white mb-4 z-10">
          <div className="text-lg font-medium">
            {currentIndex + 1} de {photos.length}
          </div>
          <button onClick={onClose} className=" cursor-pointer bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-colors" title="Cerrar (Esc)">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Imagen principal */}
        <div className="relative flex-1 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentPhoto.image_url} alt={currentPhoto.description || "Foto"} className="max-w-full max-h-[80vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />

          {/* Botón anterior */}
          {photos.length > 1 && currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="cursor-pointer absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-[#6dbcb9] text-white rounded-full p-3 transition-colors"
              title="Foto anterior (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Botón siguiente */}
          {photos.length > 1 && currentIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="cursor-pointer absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-[#6dbcb9] text-white rounded-full p-3 transition-colors"
              title="Foto siguiente (→)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Información de la foto */}
        {(currentPhoto.description || currentPhoto.year) && (
          <div className="text-white text-center mt-4 p-4 bg-black bg-opacity-50 rounded-lg">
            {currentPhoto.description && <p className="text-lg mb-1">{currentPhoto.description}</p>}
            {currentPhoto.year && <p className="text-sm text-gray-300">Año: {currentPhoto.year}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
