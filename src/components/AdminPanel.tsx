"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/supabase";
import { apiClient } from "@/lib/api-client";
import ImageUploader from "./ImageUploader";
import PhotoGallery from "./PhotoGallery";
import AlbumManager from "./AlbumManager";
import PhotoImporter from "./PhotoImporter";
import DatabaseBackup from "./DatabaseBackup";

export default function AdminPanel() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"upload" | "photos" | "unassigned" | "albums" | "import" | "backup">("upload");
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalAlbums: 0,
    totalStorageBytes: 0,
    unassignedPhotos: 0,
  });
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Helper para formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  useEffect(() => {
    // Evitar múltiples ejecuciones
    if (hasCheckedAuth) return;

    const loadUser = async () => {
      try {
        console.log("🔐 AdminPanel: Checking authentication...");
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          console.log("❌ No user found, redirecting to login");
          router.push("/login");
          return;
        }

        console.log("✅ User authenticated:", currentUser.email);
        setUser(currentUser);
        setHasCheckedAuth(true);

        // Cargar estadísticas al mismo tiempo
        await loadStats();
      } catch (error) {
        console.error("❌ Error loading user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  const loadStats = async () => {
    try {
      // Obtener todas las fotos con sus datos
      const photos = await apiClient.getPhotos();

      // Obtener todos los álbumes
      const albums = await apiClient.getAlbums();

      // Contar fotos sin álbum
      const unassignedPhotos = photos.filter((p) => !p.album_id);

      // Calcular almacenamiento total
      let totalStorageBytes = 0;
      let photosWithoutSize = 0;

      for (const photo of photos) {
        if (photo.file_size && photo.file_size > 0) {
          totalStorageBytes += photo.file_size;
        } else {
          photosWithoutSize++;
          // Estimar 350 KB por foto sin file_size
          totalStorageBytes += 350 * 1024;
        }
      }

      setStats({
        totalPhotos: photos.length,
        totalAlbums: albums.length,
        totalStorageBytes,
        unassignedPhotos: unassignedPhotos.length,
      });

      console.log("📊 Stats cargadas:", {
        photosCount: photos.length,
        albumsCount: albums.length,
        unassignedCount: unassignedPhotos.length,
        totalStorageMB: Math.round(totalStorageBytes / 1024 / 1024),
        photosWithoutSize,
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
              <p className="text-2xl font-bold text-purple-600">{formatFileSize(stats.totalStorageBytes)}</p>
              <p className="text-xs text-purple-700 mt-1">{stats.totalStorageBytes > 0 ? `${stats.totalStorageBytes.toLocaleString()} bytes` : "Sin datos de tamaño"}</p>
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
            <button
              onClick={() => setActiveTab("import")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "import" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📥 Importar Fotos
            </button>
            <button
              onClick={() => setActiveTab("backup")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "backup" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              💾 Backup BD
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

          {activeTab === "import" && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Importar Fotos desde CSV</h2>
              <PhotoImporter onImportSuccess={handleUploadSuccess} />
            </section>
          )}

          {activeTab === "backup" && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Copia de Seguridad</h2>
              <DatabaseBackup onImportSuccess={handleUploadSuccess} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
