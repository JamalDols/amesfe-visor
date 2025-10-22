-- Schema para la base de datos MySQL del visor de fotos
-- Base de datos: amesfedev

-- ============================================
-- Tabla: users
-- Almacena los usuarios administradores
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: albums
-- Almacena los álbumes de fotos
-- ============================================
CREATE TABLE IF NOT EXISTS `albums` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: photos
-- Almacena las fotos con sus metadatos
-- ============================================
CREATE TABLE IF NOT EXISTS `photos` (
  `id` VARCHAR(36) PRIMARY KEY,
  `image_url` TEXT NOT NULL,
  `description` TEXT,
  `year` INT,
  `album_id` VARCHAR(36),
  `file_size` BIGINT DEFAULT 0 COMMENT 'Tamaño del archivo en bytes',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON DELETE SET NULL,
  INDEX `idx_album_id` (`album_id`),
  INDEX `idx_year` (`year`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insertar usuario admin por defecto
-- Email: pablo.dols@gmail.com
-- Password: admin123 (cambiar después del primer login)
-- Hash generado con bcrypt (10 rounds)
-- ============================================
INSERT INTO `users` (`id`, `email`, `password_hash`)
VALUES (
  UUID(),
  'pablo.dols@gmail.com',
  '$2b$10$rKz8q7WXJ5LYvZ5YFZvQZOJ7xK3h5KQj1PJK5Xh7Z5YFZvQZOJ7xK'
) ON DUPLICATE KEY UPDATE email = email;

-- ============================================
-- Vistas útiles (opcional)
-- ============================================

-- Vista para obtener estadísticas de álbumes
CREATE OR REPLACE VIEW `album_stats` AS
SELECT 
  a.id,
  a.name,
  a.description,
  COUNT(p.id) as photo_count,
  SUM(p.file_size) as total_size,
  MAX(p.created_at) as last_photo_date,
  a.created_at,
  a.updated_at
FROM albums a
LEFT JOIN photos p ON a.id = p.album_id
GROUP BY a.id, a.name, a.description, a.created_at, a.updated_at;

-- ============================================
-- Procedimientos almacenados útiles (opcional)
-- ============================================

DELIMITER //

-- Procedimiento para eliminar un álbum y sus fotos
CREATE PROCEDURE IF NOT EXISTS `delete_album_cascade`(IN album_uuid VARCHAR(36))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Primero eliminar las fotos del álbum
  DELETE FROM photos WHERE album_id = album_uuid;
  
  -- Luego eliminar el álbum
  DELETE FROM albums WHERE id = album_uuid;
  
  COMMIT;
END //

-- Procedimiento para obtener estadísticas generales
CREATE PROCEDURE IF NOT EXISTS `get_stats`()
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM albums) as total_albums,
    (SELECT COUNT(*) FROM photos) as total_photos,
    (SELECT COUNT(*) FROM photos WHERE album_id IS NULL) as photos_without_album,
    (SELECT SUM(file_size) FROM photos) as total_storage_bytes;
END //

DELIMITER ;

-- ============================================
-- Triggers para mantener integridad (opcional)
-- ============================================

DELIMITER //

-- Trigger para prevenir eliminación accidental del último admin
CREATE TRIGGER IF NOT EXISTS `prevent_last_admin_deletion`
BEFORE DELETE ON `users`
FOR EACH ROW
BEGIN
  DECLARE admin_count INT;
  SELECT COUNT(*) INTO admin_count FROM users;
  
  IF admin_count <= 1 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se puede eliminar el último usuario administrador';
  END IF;
END //

DELIMITER ;

-- ============================================
-- Índices adicionales para optimización
-- ============================================

-- Índice compuesto para búsquedas de fotos por álbum y fecha
CREATE INDEX IF NOT EXISTS `idx_photos_album_date` ON `photos` (`album_id`, `created_at` DESC);

-- Índice para búsquedas por descripción (FULLTEXT)
CREATE FULLTEXT INDEX IF NOT EXISTS `idx_photos_description` ON `photos` (`description`);
CREATE FULLTEXT INDEX IF NOT EXISTS `idx_albums_name_description` ON `albums` (`name`, `description`);

-- ============================================
-- Fin del schema
-- ============================================
