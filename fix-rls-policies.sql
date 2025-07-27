-- Política RLS corregida para la tabla photos
-- Este SQL debe ejecutarse en el editor SQL de Supabase

-- 1. Habilitar RLS en la tabla photos (si no está ya habilitado)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 2. Política para permitir SELECT público (cualquiera puede ver las fotos)
CREATE POLICY "Photos are publicly readable" ON photos
  FOR SELECT USING (true);

-- 3. Política para permitir INSERT solo a usuarios autenticados
CREATE POLICY "Authenticated users can insert photos" ON photos
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- 4. Política para permitir UPDATE solo al usuario que subió la foto
CREATE POLICY "Users can update their own photos" ON photos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Política para permitir DELETE solo al usuario que subió la foto  
CREATE POLICY "Users can delete their own photos" ON photos
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. También para la tabla albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Albums are publicly readable" ON albums
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert albums" ON albums
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update albums" ON albums
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete albums" ON albums
  FOR DELETE USING (auth.role() = 'authenticated');
