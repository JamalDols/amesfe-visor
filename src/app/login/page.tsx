"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [showDebugPopup, setShowDebugPopup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log("🚀 Iniciando login...");
    console.log("📧 Email:", email);
    console.log("🔑 Password length:", password.length);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("📝 Respuesta completa:", { data, error });

      if (error) {
        console.error("❌ Error de Supabase:", error);
        setError(`Error: ${error.message}`);
        return;
      }

      if (data.user) {
        console.log("✅ Usuario logueado:", data.user.email);
        console.log("🔄 Redirigiendo a /admin...");

        // Mostrar popup de debug en lugar de alert
        const debugMessage = `
🎉 LOGIN EXITOSO!
✅ Usuario: ${data.user.email}
🔑 ID: ${data.user.id}
📧 Email confirmado: ${data.user.email_confirmed_at ? "Sí" : "No"}
🔐 Rol: ${data.user.role}
⏰ Último login: ${data.user.last_sign_in_at}
🔐 Sesión: ${data.session ? "Activa" : "Inactiva"}
🍪 Access Token: ${data.session?.access_token ? "Presente" : "Ausente"}

🔄 Intentando redirección a /admin...
        `;

        setDebugInfo(debugMessage);
        setShowDebugPopup(true);

        // Verificar que la sesión se guardó antes de redirigir
        setTimeout(async () => {
          console.log("🚀 Verificando sesión antes de redirigir...");
          const { data: sessionCheck } = await supabase.auth.getSession();
          console.log("📋 Verificación de sesión:", sessionCheck);

          if (sessionCheck.session) {
            console.log("✅ Sesión confirmada, redirigiendo...");
            window.location.href = "/admin";
          } else {
            console.error("❌ No hay sesión activa después del login");
            setError("Error: la sesión no se guardó correctamente");
            setShowDebugPopup(false);
          }
        }, 1000);
      } else {
        console.log("⚠️ No hay usuario en la respuesta");
        setError("No se recibió información del usuario");
      }
    } catch (err) {
      console.error("💥 Error inesperado:", err);
      setError("Error inesperado al iniciar sesión");
    }
  };

  const testLoginAPI = async () => {
    setTestResult("Probando login via API...");

    try {
      const response = await fetch("/api/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      setTestResult(`Resultado: ${JSON.stringify(result, null, 2)}`);
      console.log("🧪 Test API Result:", result);
    } catch (err) {
      setTestResult(`Error: ${err}`);
      console.error("🧪 Test API Error:", err);
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
            />
          </div>

          {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}

          <div className="mb-6">
            <button type="submit" className="w-full bg-[#354564] text-white py-3 px-4 rounded-lg hover:bg-[#6DBCB9] transition duration-300 font-medium">
              Iniciar Sesión
            </button>
          </div>

          <div className="mt-4">
            <button type="button" onClick={testLoginAPI} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-300">
              🧪 Test Login API
            </button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 transition duration-300">
            ← Volver a la galería
          </Link>
        </div>
      </div>

      {/* Popup de Debug */}
      {showDebugPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-green-600">🎉 Debug Info</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-100 p-4 rounded-lg mb-4">{debugInfo}</pre>
            <div className="flex gap-2">
              <button onClick={() => setShowDebugPopup(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                Cerrar
              </button>
              <button onClick={() => (window.location.href = "/admin")} className="flex-1 px-4 py-2 bg-[#354564] text-white rounded-lg hover:bg-[#6DBCB9]">
                Ir a Admin Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
