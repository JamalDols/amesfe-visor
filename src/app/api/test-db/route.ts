import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    console.log("🔍 Probando conexión a MySQL...");

    // Probar conexión básica
    const result = await query("SELECT 1 as test");
    console.log("✅ Conexión exitosa:", result);

    // Probar que existan las tablas
    const tables = await query(
      `
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `,
      [process.env.MYSQL_DATABASE]
    );

    console.log("📊 Tablas encontradas:", tables);

    // Contar registros en cada tabla
    const [usersCount] = await query("SELECT COUNT(*) as count FROM users");
    const [albumsCount] = await query("SELECT COUNT(*) as count FROM albums");
    const [photosCount] = await query("SELECT COUNT(*) as count FROM photos");

    return NextResponse.json({
      success: true,
      message: "Conexión MySQL exitosa",
      database: process.env.MYSQL_DATABASE,
      tables: tables.map((t: { TABLE_NAME: string }) => t.TABLE_NAME),
      counts: {
        users: usersCount?.count || 0,
        albums: albumsCount?.count || 0,
        photos: photosCount?.count || 0,
      },
    });
  } catch (error) {
    console.error("❌ Error en test:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        details: error,
      },
      { status: 500 }
    );
  }
}
