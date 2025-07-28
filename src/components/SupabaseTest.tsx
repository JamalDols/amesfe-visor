"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setTestResult("Probando conexión...");

    try {
      // Test 1: Verificar variables de entorno
      console.log("🔧 Variables de entorno:");
      console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Presente" : "Ausente");

      // Test 2: Probar conexión básica
      const { data, error } = await supabase.auth.getSession();
      console.log("📡 Sesión actual:", { data, error });

      // Test 3: Probar conexión a la base de datos
      const { data: dbTest, error: dbError } = await supabase.from("photos").select("count").limit(1);

      console.log("🗄️ Test de base de datos:", { dbTest, dbError });

      if (error) {
        setTestResult(`❌ Error en auth: ${error.message}`);
      } else if (dbError) {
        setTestResult(`❌ Error en DB: ${dbError.message}`);
      } else {
        setTestResult("✅ Conexión exitosa con Supabase");
      }
    } catch (err) {
      console.error("💥 Error de conexión:", err);
      setTestResult(`💥 Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateUser = async () => {
    setLoading(true);
    setTestResult("Creando usuario de prueba...");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: "pablo.dols@gmail.com",
        password: "test123456",
      });

      console.log("👤 Resultado crear usuario:", { data, error });

      if (error) {
        setTestResult(`❌ Error creando usuario: ${error.message}`);
      } else {
        setTestResult(`✅ Usuario creado/existe: ${data.user?.email}`);
      }
    } catch (err) {
      console.error("💥 Error:", err);
      setTestResult(`💥 Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">🧪 Pruebas de Supabase</h3>

      <div className="space-y-3">
        <button onClick={testConnection} disabled={loading} className="bg-[#354564] text-white px-4 py-2 rounded-lg hover:bg-[#6DBCB9] disabled:opacity-50">
          {loading ? "Probando..." : "Probar Conexión"}
        </button>

        <button onClick={testCreateUser} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 ml-2">
          {loading ? "Creando..." : "Crear/Verificar Usuario Admin"}
        </button>
      </div>

      {testResult && <div className="mt-4 p-3 bg-white border rounded text-sm font-mono">{testResult}</div>}

      <div className="mt-4 text-xs text-yellow-700">⚠️ Abre las herramientas de desarrollador (F12) para ver logs detallados</div>
    </div>
  );
}
