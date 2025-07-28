import { notFound } from "next/navigation";
import Link from "next/link";
import AlbumPhotosClient from "@/components/AlbumPhotosClient";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface AlbumPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Obtener información del álbum
  const { data: album, error: albumError } = await supabase.from("albums").select("*").eq("id", id).single();

  if (albumError || !album) {
    notFound();
  }

  // Obtener fotos del álbum
  const { data: photos, error: photosError } = await supabase.from("photos").select("*").eq("album_id", id).order("created_at", { ascending: false });

  if (photosError) {
    console.error("Error fetching album photos:", photosError);
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
              {photos?.length || 0} foto{photos?.length !== 1 ? "s" : ""} en este álbum
            </p>
          </div>

          {photos && photos.length > 0 ? (
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

// Generar metadata dinámicamente
export async function generateMetadata({ params }: AlbumPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: album } = await supabase.from("albums").select("name").eq("id", id).single();

  return {
    title: album ? `${album.name} - Visor de Fotos` : "Álbum no encontrado",
    description: album ? `Fotos del álbum ${album.name}` : "Álbum no encontrado",
  };
}
