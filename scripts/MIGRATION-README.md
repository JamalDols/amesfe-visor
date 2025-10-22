# 🔄 Migración de Supabase a MySQL + FTP

Scripts para exportar todos los datos e imágenes de Supabase e importarlos al nuevo sistema.

## 📋 Pasos

### 1️⃣ Exportar desde Supabase (rama actual)

Asegúrate de estar en la rama con Supabase configurado.

```bash
# Instalar tsx si no lo tienes
npm install -D tsx

# Ejecutar exportación
npx tsx scripts/export-from-supabase.ts
```

Esto creará una carpeta `export-supabase/` con:

- `export-data.json` - Metadatos de álbumes y fotos
- `images/` - Todas las imágenes descargadas

### 2️⃣ Cambiar a la rama dev (nuevo sistema)

```bash
git checkout dev
```

### 3️⃣ Copiar la carpeta de exportación

La carpeta `export-supabase/` debe estar en la raíz del proyecto en la rama dev.

```bash
# Si ya exportaste en la otra rama, simplemente cópiala:
# (ajusta la ruta según tu estructura)
cp -r ../amesfe-visor-supabase/export-supabase ./
```

### 4️⃣ Importar al nuevo sistema

Asegúrate de que:

- El archivo `.env.local` tiene todas las variables configuradas (MySQL, FTP)
- El servidor MySQL está accesible
- El servidor FTP está accesible y la carpeta `/web/wp-content/uploads/fotosvisor/` existe

```bash
# Ejecutar importación
npx tsx scripts/import-to-new-system.ts
```

## 📊 ¿Qué se migra?

✅ **Álbumes**

- ID original
- Nombre
- Descripción
- Fecha de creación

✅ **Fotos**

- ID original
- Imagen (descargada, procesada y subida al FTP)
- Descripción
- Año
- Relación con álbum
- Tamaño de archivo
- Fecha de creación

## 🔧 Troubleshooting

### Error: "Cannot find module"

```bash
# Instala las dependencias
npm install
```

### Error: "No se encontró el archivo de datos"

Primero ejecuta el script de exportación en la rama con Supabase.

### Error de conexión MySQL/FTP

Verifica que las variables de entorno en `.env.local` sean correctas.

### Las imágenes no se suben

Verifica que la carpeta `/web/wp-content/uploads/fotosvisor/` existe en el FTP y tiene permisos de escritura.

## 📝 Notas

- Las imágenes se procesan nuevamente (resize + WebP) durante la importación
- Los IDs se mantienen para preservar las referencias entre álbumes y fotos
- Si una foto ya existe (mismo ID), se actualiza
- El script muestra progreso detallado para cada operación
