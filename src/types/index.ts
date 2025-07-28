export interface Photo {
  id: string;
  image_url: string;
  description?: string;
  year?: number;
  album_id?: string;
  file_size?: number;
  created_at: string;
  albums?: {
    id: string;
    name: string;
  };
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
