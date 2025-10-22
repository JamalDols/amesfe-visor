import mysql from "mysql2/promise";

// Función para obtener la configuración con las variables de entorno actualizadas
function getDbConfig() {
  const config = {
    host: process.env.MYSQL_HOST || "mysql.amesfe.org",
    user: process.env.MYSQL_USER || "myamesfede14",
    password: process.env.MYSQL_PASSWORD || "hIq1ELCA",
    database: process.env.MYSQL_DATABASE || "amesfefotos",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  console.log("🔗 MySQL Config:", { host: config.host, user: config.user, database: config.database });
  return config;
}

// Pool de conexiones reutilizable (se crea de forma lazy)
let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(getDbConfig());
  }
  return pool;
}

/**
 * Ejecuta una query SQL y devuelve los resultados
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [results] = await getPool().execute(sql, params);
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
  if (pool) {
    await pool.end();
  }
}

export default getPool();
