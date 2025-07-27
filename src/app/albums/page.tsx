import Link from "next/link";

export default function AlbumsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">📚 Álbumes de Fotos</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-700 transition-colors">
          ← Volver al inicio
        </Link>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">No hay álbumes aún</h2>
        <p className="text-gray-600 mb-6">Los álbumes aparecerán aquí cuando se suban las primeras fotos desde el panel de administración.</p>
        <Link href="/admin" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Ir al Panel de Administración
        </Link>
      </div>
    </div>
  );
}
