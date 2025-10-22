/**
 * Cliente API para reemplazar las llamadas a Supabase
 */

export interface Photo {
  id: string;
  image_url: string;
  description: string | null;
  year: number | null;
  album_id: string | null;
  file_size: number;
  created_at: string;
  updated_at: string;
  album_name?: string;
}

export interface Album {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  photo_count?: number;
  total_size?: number;
}

class ApiClient {
  private baseUrl = "/api";

  // Auth
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error en login");
    }

    return response.json();
  }

  async logout() {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Error en logout");
    }

    return response.json();
  }

  async checkAuth() {
    const response = await fetch(`${this.baseUrl}/auth/me`);
    return response.ok ? response.json() : { authenticated: false };
  }

  // Albums
  async getAlbums(): Promise<Album[]> {
    const response = await fetch(`${this.baseUrl}/albums`);
    if (!response.ok) throw new Error("Error obteniendo álbumes");
    return response.json();
  }

  async getAlbum(id: string): Promise<Album & { photos: Photo[] }> {
    const response = await fetch(`${this.baseUrl}/albums/${id}`);
    if (!response.ok) throw new Error("Error obteniendo álbum");
    return response.json();
  }

  async createAlbum(data: { name: string; description?: string }): Promise<Album> {
    const response = await fetch(`${this.baseUrl}/albums`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creando álbum");
    }

    return response.json();
  }

  async updateAlbum(id: string, data: { name: string; description?: string }): Promise<Album> {
    const response = await fetch(`${this.baseUrl}/albums/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Error actualizando álbum");
    return response.json();
  }

  async deleteAlbum(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/albums/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error eliminando álbum");
  }

  // Photos
  async getPhotos(params?: { album_id?: string; unassigned?: boolean; search?: string; year?: number }): Promise<Photo[]> {
    const searchParams = new URLSearchParams();

    if (params?.album_id) searchParams.set("album_id", params.album_id);
    if (params?.unassigned) searchParams.set("unassigned", "true");
    if (params?.search) searchParams.set("search", params.search);
    if (params?.year) searchParams.set("year", params.year.toString());

    const url = `${this.baseUrl}/photos${searchParams.toString() ? `?${searchParams}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error("Error obteniendo fotos");
    return response.json();
  }

  async getPhoto(id: string): Promise<Photo> {
    const response = await fetch(`${this.baseUrl}/photos/${id}`);
    if (!response.ok) throw new Error("Error obteniendo foto");
    return response.json();
  }

  async updatePhoto(
    id: string,
    data: {
      description?: string;
      year?: number;
      album_id?: string | null;
    }
  ): Promise<Photo> {
    const response = await fetch(`${this.baseUrl}/photos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Error actualizando foto");
    return response.json();
  }

  async deletePhoto(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/photos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error eliminando foto");
  }

  async updatePhotosAlbum(photoIds: string[], albumId: string | null): Promise<void> {
    const promises = photoIds.map((id) => this.updatePhoto(id, { album_id: albumId }));

    await Promise.all(promises);
  }

  // Upload
  async uploadPhotos(
    files: File[],
    options?: {
      albumId?: string;
      descriptions?: string[];
      years?: string[];
    }
  ): Promise<{ success: boolean; uploaded: number; total: number; results: unknown[] }> {
    const formData = new FormData();

    files.forEach((file) => formData.append("files", file));

    if (options?.albumId) {
      formData.append("albumId", options.albumId);
    }

    options?.descriptions?.forEach((desc) => {
      formData.append("descriptions", desc);
    });

    options?.years?.forEach((year) => {
      formData.append("years", year);
    });

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error subiendo archivos");
    }

    return response.json();
  }

  // Stats
  async getStats(): Promise<{
    totalPhotos: number;
    totalAlbums: number;
    totalStorage: number;
    photosWithoutAlbum: number;
  }> {
    const [photos, albums] = await Promise.all([this.getPhotos(), this.getAlbums()]);

    const totalStorage = photos.reduce((sum, p) => sum + (p.file_size || 0), 0);
    const photosWithoutAlbum = photos.filter((p) => !p.album_id).length;

    return {
      totalPhotos: photos.length,
      totalAlbums: albums.length,
      totalStorage,
      photosWithoutAlbum,
    };
  }
}

export const apiClient = new ApiClient();
