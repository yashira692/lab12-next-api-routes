# Biblioteca – API Routes con Next.js y Prisma (GLAB-S12)

Laboratorio Semana 12 del curso **Desarrollo de Aplicaciones Web Avanzado** (TECSUP).
Sistema de biblioteca con autores y libros construido con **Next.js (App Router) API Routes**, **Prisma ORM** y **PostgreSQL (Supabase)**.

Autora: Yashira Rojas Alarcon

## Funcionalidades

### API Routes
| Método | Ruta | Descripción |
|---|---|---|
| GET / POST | `/api/authors` | Listar y crear autores |
| GET / PUT / DELETE | `/api/authors/[id]` | Obtener, actualizar y eliminar un autor |
| GET | `/api/authors/[id]/books` | Libros de un autor |
| GET | `/api/authors/[id]/stats` | Estadísticas del autor (tarea) |
| GET / POST | `/api/books` | Listar (filtros `genre`, `authorId`) y crear libros |
| GET / PUT / DELETE | `/api/books/[id]` | Obtener, actualizar y eliminar un libro |
| GET | `/api/books/search` | Búsqueda con filtros, ordenamiento y paginación (tarea) |

Parámetros de `/api/books/search`: `search`, `genre`, `authorName`, `page` (default 1), `limit` (default 10, máx. 50), `sortBy` (`title`, `publishedYear`, `createdAt`) y `order` (`asc`, `desc`).

### Páginas
- `/` – Dashboard: estadísticas generales y CRUD de autores.
- `/books` – Búsqueda de libros en tiempo real, filtros por género y autor, ordenamiento, paginación y CRUD de libros.
- `/authors/[id]` – Detalle del autor con sus estadísticas, sus libros y formularios de edición.

## Cómo ejecutarlo

1. Copiar `.env.example` como `.env` y colocar la cadena de conexión de Supabase (Session pooler).
2. Instalar dependencias y crear las tablas:
   ```bash
   npm install
   npx prisma db push
   npm run seed   # opcional: datos de prueba
   npm run dev
   ```
3. Abrir http://localhost:3000

La colección de Postman `GLAB-S12-Biblioteca.postman_collection.json` incluye todas las peticiones.
