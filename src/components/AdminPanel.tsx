"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut, supabase } from "@/lib/supabase";
import ImageUploader from "./ImageUploader";
import PhotoGallery from "./PhotoGallery";
import AlbumManager from "./AlbumManager";

import { User } from "@supabase/supabase-js";

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"upload" | "photos" | "unassigned" | "albums">("upload");
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalAlbums: 0,
    totalStorage: 0,
    unassignedPhotos: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        // Cargar estadísticas al mismo tiempo
        await loadStats();
      } catch (error) {
        console.error("Error loading user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const loadStats = async () => {
    try {
      // Contar fotos
      const { count: photosCount } = await supabase.from("photos").select("*", { count: "exact", head: true });

      // Contar álbumes
      const { count: albumsCount } = await supabase.from("albums").select("*", { count: "exact", head: true });

      // Contar fotos sin álbum
      const { count: unassignedCount } = await supabase.from("photos").select("*", { count: "exact", head: true }).is("album_id", null);

      // Calcular almacenamiento (suma de file_size)
      const { data: storageData } = await supabase.from("photos").select("file_size");

      const totalStorage = storageData?.reduce((sum, photo) => sum + (photo.file_size || 0), 0) || 0;

      setStats({
        totalPhotos: photosCount || 0,
        totalAlbums: albumsCount || 0,
        totalStorage: Math.round(totalStorage / 1024 / 1024), // MB
        unassignedPhotos: unassignedCount || 0,
      });

      console.log("📊 Stats cargadas:", {
        photosCount,
        albumsCount,
        unassignedCount,
        totalStorage: Math.round(totalStorage / 1024 / 1024),
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleUploadSuccess = () => {
    // Refrescar galería y estadísticas cuando se suban fotos
    setRefreshTrigger((prev) => prev + 1);
    loadStats();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Bienvenido, {user?.email || "admin"}</p>
            </div>
            <button onClick={handleSignOut} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Estadísticas */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Estadísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900">Total de Fotos</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalPhotos}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-900">Álbumes</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalAlbums}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-900">Sin Álbum</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.unassignedPhotos}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-purple-900">Almacenamiento</h3>
              <p className="text-lg font-bold text-purple-600">{stats.totalStorage} MB</p>
            </div>
          </div>
        </section>

        {/* Navegación por pestañas */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("upload")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "upload" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📤 Subir Fotos
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "photos" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🖼️ Todas las Fotos
            </button>
            <button
              onClick={() => setActiveTab("unassigned")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "unassigned" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ⚠️ Sin Álbum ({stats.unassignedPhotos})
            </button>
            <button
              onClick={() => setActiveTab("albums")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "albums" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📁 Gestionar Álbumes
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="space-y-8">
          {activeTab === "upload" && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Subir Imágenes</h2>
              <ImageUploader onUploadSuccess={handleUploadSuccess} />
            </section>
          )}

          {activeTab === "photos" && (
            <section className="bg-white rounded-lg shadow p-6">
              <PhotoGallery refreshTrigger={refreshTrigger} />
            </section>
          )}

          {activeTab === "unassigned" && (
            <section className="bg-white rounded-lg shadow p-6">
              <PhotoGallery refreshTrigger={refreshTrigger} showUnassigned={true} />
            </section>
          )}

          {activeTab === "albums" && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Gestión de Álbumes</h2>
              <AlbumManager onAlbumCreated={handleUploadSuccess} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
