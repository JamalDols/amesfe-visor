export interface Photo {
  id: string;
  image_url: string;
  description?: string | null;
  year?: number | null;
  album_id?: string | null;
  file_size?: number | null;
  created_at: string;
  albums?: {
    id: string;
    name: string;
  } | null;
}

export interface Album {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}
