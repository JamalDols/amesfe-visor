# 📸 Visor de Fotos

Una aplicación web moderna construida con Next.js 15 y Supabase que funciona como galería de fotos pública con panel de administración.

## 🚀 Características

- **Galería pública**: Visualización de fotos organizadas por álbumes
- **Panel de administración**: Sistema de login para un único administrador
- **Subida de imágenes**: Upload múltiple con compresión automática a WebP
- **Optimización**: Redimensionado y compresión automática de imágenes
- **Responsive**: Diseño adaptable a dispositivos móviles y desktop
- **Moderno**: Construido con Next.js 15 (App Router) y TailwindCSS

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 con App Router
- **Estilos**: TailwindCSS v4
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Almacenamiento**: Supabase Storage
- **Compresión de imágenes**: browser-image-compression
- **Upload**: react-dropzone

## 📦 Instalación

1. **Clonar el repositorio**

```bash
git clone <url-del-repo>
cd amesfe-visor
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
ADMIN_EMAIL=admin@tudominio.com
```

4. **Ejecutar en desarrollo**

```bash
npm run dev
```

## 🗄️ Configuración de Supabase

### 1. Crear proyecto en Supabase

- Ve a [Supabase](https://supabase.com)
- Crea un nuevo proyecto
- Obtén la URL y la clave anónima del proyecto

### 2. Configurar autenticación

En el panel de Supabase:

- Ve a Authentication > Settings
- Configura el método de autenticación por email
- Crea un usuario administrador

### 3. Configurar Storage

- Ve a Storage y crea un bucket llamado `photos`
- Configura las políticas de acceso según tus necesidades

### 4. Esquema de base de datos (próximamente)

Se creará automáticamente cuando implementes la funcionalidad de upload.

## 📂 Estructura del proyecto

```
src/
├── app/
│   ├── admin/          # Panel de administración (protegido)
│   ├── albums/         # Página de álbumes públicos
│   ├── login/          # Página de inicio de sesión
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página de inicio
├── components/
│   ├── AdminPanel.tsx  # Componente del panel de admin
│   └── ImageUploader.tsx # Componente para subir imágenes
├── lib/
│   ├── supabase.ts     # Cliente de Supabase (client-side)
│   └── supabase-server.ts # Cliente de Supabase (server-side)
└── types/
    └── index.ts        # Tipos TypeScript
```

## 🔐 Autenticación

La aplicación usa Supabase Auth con las siguientes rutas:

- `/login` - Página de inicio de sesión
- `/admin` - Panel de administración (requiere autenticación)
- `middleware.ts` - Protege las rutas automáticamente

## 🎨 Estilos

Usa TailwindCSS v4 con:

- Diseño responsive
- Color scheme adaptable
- Componentes reutilizables
- Fuente Inter

## 🚧 Próximas características

- ✅ Estructura base del proyecto
- ✅ Autenticación con Supabase
- ✅ Panel de administración básico
- ✅ Componente de upload con react-dropzone
- ⏳ Subida real a Supabase Storage
- ⏳ Compresión y conversión a WebP
- ⏳ Gestión de álbumes
- ⏳ Galería pública
- ⏳ Búsqueda y filtros

## 📄 Licencia

MIT
