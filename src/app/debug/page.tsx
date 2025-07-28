import SupabaseTest from "@/components/SupabaseTest";

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">🔧 Página de Debug</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Variables de entorno:</h2>
          <div className="font-mono text-sm space-y-2">
            <div>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "No definida"}</div>
            <div>SUPABASE_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Presente ✅" : "Ausente ❌"}</div>
            <div>ADMIN_EMAIL: {process.env.ADMIN_EMAIL || "No definida"}</div>
          </div>
        </div>

        <SupabaseTest />

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📋 Pasos para solucionar:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Ejecuta &quot;Probar Conexión&quot; para verificar que Supabase esté accesible</li>
            <li>Ejecuta &quot;Crear/Verificar Usuario Admin&quot; para asegurar que el usuario existe</li>
            <li>Ve a tu panel de Supabase → Authentication → Users</li>
            <li>Verifica que el usuario pablo.dols@gmail.com existe</li>
            <li>Si existe, verifica que la contraseña sea correcta</li>
            <li>Abre las herramientas de desarrollador (F12) para ver logs detallados</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
