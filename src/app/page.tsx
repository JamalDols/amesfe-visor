import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function HomePage() {
  // Obtener las últimas 6 fotos para mostrar
  const supabase = await createServerSupabaseClient();
  const { data: recentPhotos } = await supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(6);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">📸 Visor de Fotos</h1>
        <p className="text-lg text-gray-600 mb-8">Galería de fotos pública con administración</p>
        <div className="flex justify-center gap-4">
          <Link href="/albums" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Ver Álbumes
          </Link>
          <Link href="/admin" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
            Administración
          </Link>
        </div>
      </header>

      <section className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Fotos Recientes</h2>

        {recentPhotos && recentPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentPhotos.map((photo) => (
              <div key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt={photo.description || "Foto"} className="w-full h-32 object-cover rounded-lg" />
                {photo.description && <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b-lg">{photo.description}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <p>No hay fotos subidas aún</p>
            <p className="text-sm mt-2">Ve al panel de administración para subir las primeras fotos</p>
          </div>
        )}
      </section>
    </div>
  );
}
