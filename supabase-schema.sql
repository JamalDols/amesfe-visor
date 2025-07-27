-- Tabla para álbumes
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para fotos
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  year INTEGER,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_photos_album_id ON photos(album_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_photos_year ON photos(year);

-- Políticas RLS (Row Level Security)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública para álbumes y fotos
CREATE POLICY "Albums are viewable by everyone" ON albums
  FOR SELECT USING (true);

CREATE POLICY "Photos are viewable by everyone" ON photos
  FOR SELECT USING (true);

-- Solo usuarios autenticados pueden insertar/actualizar/eliminar
CREATE POLICY "Only authenticated users can insert albums" ON albums
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update albums" ON albums
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete albums" ON albums
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can insert photos" ON photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update photos" ON photos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete photos" ON photos
  FOR DELETE USING (auth.role() = 'authenticated');
