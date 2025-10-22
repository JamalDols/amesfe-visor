// Este archivo se mantiene por compatibilidad pero ya no se usa
// La aplicación ahora usa MySQL + FTP en lugar de Supabase

// Objeto mock de Supabase para evitar errores en componentes legacy
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      remove: () => Promise.resolve({ data: null, error: null }),
    }),
  },
};

// Helper functions adaptadas al nuevo sistema
export const isAuthenticated = async () => {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    return data.authenticated || false;
  } catch {
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    console.log("🔍 getCurrentUser: Fetching /api/auth/me");
    const response = await fetch("/api/auth/me", {
      credentials: "include", // Asegurar que las cookies se envíen
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      console.log("❌ Response not OK, returning null");
      return null;
    }

    const data = await response.json();
    console.log("📊 Response data:", data);

    return data.user || null;
  } catch (error) {
    console.error("❌ Error in getCurrentUser:", error);
    return null;
  }
};

export const signOut = async () => {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
