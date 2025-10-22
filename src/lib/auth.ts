import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { query, queryOne } from "./db";

export interface User {
  id: string;
  email: string;
  created_at: Date;
}

export interface Session {
  userId: string;
  email: string;
  createdAt: number;
}

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

/**
 * Verifica las credenciales del usuario
 */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  try {
    const user = await queryOne<{ id: string; email: string; password_hash: string; created_at: Date }>("SELECT id, email, password_hash, created_at FROM users WHERE email = ?", [email]);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return null;
  }
}

/**
 * Crea un nuevo usuario (solo para setup inicial)
 */
export async function createUser(email: string, password: string): Promise<User> {
  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);

  await query("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)", [id, email, password_hash]);

  return {
    id,
    email,
    created_at: new Date(),
  };
}

/**
 * Crea una sesión para el usuario
 */
export async function createSession(user: User): Promise<void> {
  const session: Session = {
    userId: user.id,
    email: user.email,
    createdAt: Date.now(),
  };

  console.log("🍪 Creating session for user:", user.email);

  const cookieStore = await cookies();
  const sessionString = JSON.stringify(session);

  console.log("📝 Session data:", sessionString);

  cookieStore.set(SESSION_COOKIE_NAME, sessionString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  console.log("✅ Cookie set with options:", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Obtiene la sesión actual
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    console.log("🔍 getSession called");
    console.log("🍪 Session cookie:", sessionCookie ? "found" : "not found");

    if (!sessionCookie) {
      console.log("❌ No session cookie");
      return null;
    }

    console.log("📝 Cookie value length:", sessionCookie.value.length);

    const session: Session = JSON.parse(sessionCookie.value);

    console.log("✅ Session parsed:", { userId: session.userId, email: session.email });

    // Verificar que la sesión no haya expirado
    const now = Date.now();
    const age = (now - session.createdAt) / 1000; // en segundos

    console.log("⏰ Session age:", Math.floor(age), "seconds");

    if (age > SESSION_MAX_AGE) {
      console.log("❌ Session expired");
      await destroySession();
      return null;
    }

    console.log("✅ Session valid");
    return session;
  } catch (error) {
    console.error("❌ Error getting session:", error);
    return null;
  }
}

/**
 * Destruye la sesión actual
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Obtiene el usuario actual desde la sesión
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  try {
    const user = await queryOne<{ id: string; email: string; created_at: Date }>("SELECT id, email, created_at FROM users WHERE id = ?", [session.userId]);

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Middleware para proteger rutas (usar en API routes)
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  return user;
}
