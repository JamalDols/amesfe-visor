import Link from "next/link";
import HomeAlbumGallery from "@/components/HomeAlbumGallery";

export default function HomePage() {
  return (
    <div>
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">📸 Visor de Fotos</h1>
            </div>
            <div className="flex gap-4">
              <Link href="/admin" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <HomeAlbumGallery />
    </div>
  );
}
