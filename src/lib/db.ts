import mysql from "mysql2/promise";

// Configuración de la conexión MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  user: process.env.MYSQL_USER || "myamesfede14",
  password: process.env.MYSQL_PASSWORD || "hIq1ELCA",
  database: process.env.MYSQL_DATABASE || "amesfedev",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Pool de conexiones reutilizable
const pool = mysql.createPool(dbConfig);

/**
 * Ejecuta una query SQL y devuelve los resultados
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Ejecuta una query y devuelve solo el primer resultado
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Cierra el pool de conexiones (útil para testing)
 */
export async function closePool() {
  await pool.end();
}

export default pool;
