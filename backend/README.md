# Backend - Sistema de Gestión de Incidencias

Este backend implementa la API RESTful para el sistema de denuncias ciudadanas.

## Puntos clave
- Node.js, Express, Sequelize y PostgreSQL (recomendado)
- JWT para autenticación y roles (ciudadano, autoridad, admin)
- Gestión de usuarios, incidencias, historial, comentarios y evidencias
- Exportación de reportes (Excel/PDF)
- Almacenamiento de imágenes en Cloudinary

Consulta detalles ampliados en [../readme-guia.md](../readme-guia.md).

## Estructura de carpetas
- `models/` — Modelos Sequelize: User, Report, Image, Comment, Historial
- `routes/` — Rutas API: auth, users, reports, dashboard
- `middleware/` — Autenticación y autorización
- `config/` — Configuración de servicios externos (Cloudinary)
- `scripts/` — Scripts utilitarios (crear admin, etc.)

## Instalación y configuración
1. Instala dependencias:
  ```bash
  npm install
  ```
2. Copia `.env.example` a `.env` y configura:
  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, JWT_SECRET
3. Crea la base de datos y aplica el esquema:
  ```bash
  psql -h <host> -U <usuario> -d <nombre_bd> -f postgres_schema.sql
  ```
  O usa los scripts automáticos:
  - Windows: `../db_setup.ps1`
  - Linux/macOS: `../db_setup.sh`
4. Crea un usuario admin:
  - Ejecuta `node scripts/create_admin.js` o inserta manualmente (ver ejemplo en postgres_schema.sql)

## Ejecución
- Modo producción:
  ```bash
  npm start
  ```
- Modo desarrollo (hot reload):
  ```bash
  npm run dev
  ```

## Endpoints principales
- `POST /api/auth/register` — Registro de usuario
- `POST /api/auth/login` — Login y JWT
- `GET /api/reports/public` — Incidencias públicas (mapa)
- `GET /api/reports/export?format=excel|pdf` — Exportar reportes (admin/autoridad)
- `GET/PUT /api/users/profile` — Perfil de usuario

## Ejemplo de autenticación
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correoElectronico":"admin@gmail.com","password":"admin123"}'
```

---

Para problemas conocidos y tareas, revisa [../TODO_NOTES.md](../TODO_NOTES.md).
```
Respuesta:
```json
{"token": "<JWT>"}
```

## Ejemplo de exportación de reportes
```bash
curl -X GET "http://localhost:5000/api/reports/export?format=excel" \
  -H "Authorization: Bearer <JWT>" --output reportes.xlsx
```

## Estadísticas y ejemplos
- **Usuarios:** ciudadanos, autoridades, admins (roles diferenciados)
- **Reportes:** pueden tener imágenes, historial de estados, comentarios
- **Exportación:** admins/autoridades pueden exportar reportes a Excel/PDF
- **Autenticación:** JWT, roles, protección de rutas

## Notas
- El backend escucha en `http://localhost:5000` por defecto
- Consulta el archivo `postgres_schema.sql` para el modelo de datos y ejemplos de inserción
- El sistema es extensible para nuevos roles, categorías y distritos

---
Desarrollado para fines académicos. Consulta el código y los comentarios para más detalles.
