"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("🚀 Iniciando login...");
    console.log("📧 Email:", email);

    try {
      const result = await apiClient.login(email, password);

      if (result.success) {
        console.log("✅ Usuario logueado:", result.user.email);
        console.log("🔄 Redirigiendo a /admin...");
        // Usar window.location en lugar de router.push para asegurar que las cookies se carguen
        window.location.href = "/admin";
      }
    } catch (err) {
      console.error("❌ Error de login:", err);
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">🔐 Admin Login</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

          <div className="mb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#354564] text-white py-3 px-4 rounded-lg hover:bg-[#6DBCB9] transition duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 transition duration-300">
            ← Volver a la galería
          </Link>
        </div>
      </div>
    </div>
  );
}
