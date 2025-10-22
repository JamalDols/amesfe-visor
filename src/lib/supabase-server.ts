// Este archivo se mantiene por compatibilidad pero ya no se usa
// La aplicación ahora usa MySQL + FTP en lugar de Supabase

// Mock de cliente servidor de Supabase para evitar errores
export const createServerSupabaseClient = async () => {
  return {
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
};
