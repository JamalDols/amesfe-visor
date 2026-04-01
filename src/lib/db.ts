import mysql from "mysql2/promise";

// En desarrollo Next.js hace hot-reload y recrea módulos, lo que acumula pools
// huérfanos. Guardamos el pool en globalThis para reutilizarlo entre recargas.
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host:     process.env.MYSQL_HOST     || "mysql.amesfe.org",
    user:     process.env.MYSQL_USER     || "myamesfede14",
    password: process.env.MYSQL_PASSWORD || "hIq1ELCA",
    database: process.env.MYSQL_DATABASE || "amesfefotos",
    waitForConnections: true,
    connectionLimit: 3,   // conservador para hosting compartido (límite 20)
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
}

function getPool(): mysql.Pool {
  if (process.env.NODE_ENV === "development") {
    // Reutilizar el pool entre hot-reloads en desarrollo
    if (!globalThis.__mysqlPool) {
      globalThis.__mysqlPool = createPool();
    }
    return globalThis.__mysqlPool;
  }
  // En producción el módulo solo se carga una vez, un pool estático es suficiente
  if (!globalThis.__mysqlPool) {
    globalThis.__mysqlPool = createPool();
  }
  return globalThis.__mysqlPool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [results] = await getPool().execute(sql, params);
    return results as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function closePool() {
  if (globalThis.__mysqlPool) {
    await globalThis.__mysqlPool.end();
    globalThis.__mysqlPool = undefined;
  }
}

export default getPool;
