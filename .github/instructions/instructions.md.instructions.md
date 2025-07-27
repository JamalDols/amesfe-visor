---
applyTo: "**"
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

1. **Project Structure**: Understand the overall structure of the project, including key directories and files. This will help in navigating the codebase and making informed decisions.

2. **Coding Standards**: Follow established coding standards and best practices for the programming languages and frameworks used in the project. This includes naming conventions, file organization, and code formatting.

3. **Documentation**: Refer to existing documentation for guidance on project-specific conventions and workflows. This includes README files, code comments, and external documentation.

4. **Testing**: Write tests for new code and ensure existing tests pass before making changes. Follow the project's testing framework and conventions.

5. **Collaboration**: Communicate effectively with team members and seek feedback on code changes. Use pull requests for code reviews and discussions.

6. **Continuous Learning**: Stay updated on relevant technologies and best practices. Share knowledge with the team and contribute to a culture of learning.

Perfecto, Pablo. Con eso te armo dos cosas bien claras para arrancar: 1. ✅ Un instructions.md para levantar el proyecto desde cero 2. 💡 Un prompt de GitHub Copilot o GPT-style para que te genere código orientado a esta estructura

⸻

🧾 instructions.md — Proyecto “Visor de Fotos” con Next + Supabase

# 🖼️ Visor de Fotos con Next.js y Supabase

Este proyecto es una galería de fotos pública con panel de administración privado. El administrador puede subir imágenes, organizarlas por álbumes, añadir metadatos y gestionar las fotos fácilmente.

---

## 🛠️ Stack

- **Frontend:** Next.js 15 + App Router + Tailwind CSS
- **Backend-as-a-Service:** Supabase (DB, Auth, Storage)
- **Autenticación:** Supabase Auth (email/password, solo un admin)
- **Gestión de imágenes:** `browser-image-compression` o `sharp`
- **Almacenamiento:** Supabase Storage
- **Despliegue:** Vercel

---

## ⚙️ Instalación

````bash
npx create-next-app@latest visor-fotos --app --ts
cd visor-fotos
npm install @supabase/supabase-js browser-image-compression react-dropzone clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

Configura tailwind.config.js y globals.css.

⸻

🔐 Supabase: Configuración
	1.	Entra en supabase.com, crea un nuevo proyecto.
	2.	Activa Auth (email/password) y crea un usuario administrador manualmente.
	3.	Crea las siguientes tablas en la DB:

photos

Campo	Tipo	Descripción
id	UUID (PK)
image_url	text	URL del archivo en Storage
description	text	Texto opcional
year	integer	Año de la foto
album_id	UUID	Relación con albums
created_at	timestamptz	Fecha de subida

albums

Campo	Tipo	Descripción
id	UUID (PK)
name	text	Nombre del álbum
created_at	timestamptz	Fecha de creación

	4.	Crea un bucket en Supabase Storage llamado photos.
	5.	Asegúrate de que el bucket sea público (modo solo lectura para visitantes).

⸻

🔐 Auth y RLS
	•	Solo el email del administrador podrá usar las rutas protegidas.
	•	Habilita RLS en photos y albums si quieres controlar permisos, pero no es obligatorio si el acceso se gestiona desde el frontend.

⸻

📸 Flujo de subida
	1.	Admin accede con login.
	2.	Puede subir múltiples imágenes.
	3.	Se redimensionan a 2000px por el lado mayor y se convierten a .webp.
	4.	Se suben al bucket photos.
	5.	Se guarda el image_url, descripción, año y álbum (opcional) en la tabla photos.

⸻

🧭 Navegación pública
	•	/: muestra las fotos más recientes
	•	/albums: muestra los álbumes disponibles
	•	/albums/[id]: muestra fotos de ese álbum
	•	/search?query=: permite buscar por palabra en descripción o por década (ej. “198x”)
	•	/admin: vista protegida (solo login del admin)

⸻

☁️ Despliegue en Vercel
	1.	Conecta el repositorio de GitHub.
	2.	Añade las variables de entorno:

SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=pk_...
SUPABASE_SERVICE_ROLE_KEY= (solo si necesitas exportar la DB)
ADMIN_EMAIL=admin@tudominio.com

	3.	Publica y listo.

⸻

🧪 Funciones extra
	•	✅ Exportar a CSV o JSON desde la vista admin (botón de backup)
	•	✅ Mostrar 3 últimas fotos del álbum como portada
	•	✅ Buscar por descripción o década (198x, 200x, etc.)

---

## 🤖 Prompt para GitHub Copilot o GPT (para generar base de código)

```txt
Estoy creando una app en Next.js con Supabase para un visor de fotos público y privado.

**Requisitos clave:**

- Las fotos se pueden subir por parte de un administrador autenticado con email y contraseña (solo un usuario).
- Las fotos se almacenan en Supabase Storage y se redimensionan automáticamente a un máximo de 2000px y se convierten a `.webp`.
- Se pueden crear álbumes, mover fotos entre álbumes, añadir descripción y año.
- La galería pública muestra todas las fotos o por álbum.
- En la búsqueda pública se puede filtrar por palabra clave o por década (198x, 199x, 200x…).
- Los álbumes muestran como portada las 3 últimas fotos subidas.
- Desde el panel admin, se pueden subir varias imágenes a la vez, borrarlas, moverlas, editarlas, etc.

**Estructura del proyecto:**
- `/admin`: panel privado solo accesible por el admin autenticado
- `/albums`: lista de álbumes públicos
- `/albums/[id]`: detalle de álbum
- `/search`: vista de resultados por búsqueda
- `/api/upload`: API route para procesar imágenes y subirlas a Supabase

Usa Tailwind para el diseño. Emplea browser-image-compression para redimensionar y convertir imágenes antes de subirlas. Crea los hooks necesarios para Supabase Auth y Storage. Divide los componentes por carpetas (`components`, `lib`, `app`, `types`). Haz que el código sea limpio y modular.


⸻
````
