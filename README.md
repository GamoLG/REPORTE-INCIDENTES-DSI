# Proyecto de Incidencias

Aplicación web integral para el reporte, gestión y seguimiento de incidencias ciudadanas.

Incluye:
- Backend en Node.js/Express con Sequelize y PostgreSQL
- Frontend en HTML/CSS/JS (con migración a React.js en proceso)
- Almacenamiento de imágenes en la nube (Cloudinary)

## Puntos clave del proyecto

1. **Implementación del sistema web de denuncias**: Registro, consulta y seguimiento de incidencias por parte de ciudadanos, autoridades y administradores, con autenticación JWT y roles diferenciados.
2. **Desarrollo de módulos de mantenimiento**: Gestión de usuarios, incidencias, historial, comentarios y evidencias, con paneles y validaciones por rol.
3. **Optimización y mejora del diseño con React.js**: Migración progresiva del frontend a React para una experiencia moderna y eficiente.
4. **Despliegue en la nube**: Backend, frontend y base de datos configurados para funcionar en servidores cloud, con seguridad y monitoreo.

Consulta detalles ampliados en [readme-guia.md](readme-guia.md).

## Arquitectura del sistema

```mermaid
graph TD;
    A[Frontend (HTML/CSS/JS/React)] --API REST--> B[Backend (Node.js/Express)]
    B --ORM--> C[(PostgreSQL)]
    B --Cloudinary--> D[Almacenamiento de imágenes]
```

## Ejemplos de uso de la API

### Registro de usuario

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "12345678",
    "nombreCompleto": "Juan Pérez",
    "correoElectronico": "juan@example.com",
    "password": "secreto123",
    "rol": "ciudadano"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correoElectronico": "juan@example.com",
    "password": "secreto123"
  }'
```

Respuesta:
```json
{
  "token": "<JWT>"
}
```

### Exportar reportes (Excel)

```bash
curl -X GET "http://localhost:5000/api/reports/export?format=excel" \
  -H "Authorization: Bearer <JWT>" --output reportes.xlsx
```

### Obtener incidencias públicas para el mapa

```bash
curl http://localhost:5000/api/reports/public
```

---

Para notas técnicas, tareas y problemas conocidos, revisa [TODO_NOTES.md](TODO_NOTES.md).

# Proyecto Incidentes

Aplicación web para el reporte y gestión de incidencias ciudadanas. Incluye un backend en Node.js/Express con Sequelize y PostgreSQL, y un frontend estático en HTML/CSS/JS.

## Estructura del proyecto

- `backend/`: Servidor Express, modelos Sequelize, rutas API, scripts y configuración.
- `frontend/`: Páginas HTML, CSS y JS para usuarios ciudadanos y administradores.
- `backend/postgres_schema.sql`: Esquema SQL para PostgreSQL.
- `TODO_NOTES.md`: Tareas y mejoras pendientes.

## Requisitos

- Node.js 18+ (o LTS compatible)
- PostgreSQL 12+
- npm

## Instalación y configuración

1. **Instalar dependencias** (desde la raíz):
	 ```powershell
	 npm install
	 cd backend
	 npm install
	 cd ..
	 ```

2. **Configurar variables de entorno** para el backend:
	 - Copia `backend/.env.example` a `backend/.env` y edítalo con tus credenciales:
		 ```powershell
		 copy backend\.env.example backend\.env
		 ```
	 - Variables mínimas:
		 - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`

3. **Crear la base de datos y aplicar el esquema**:
	 - Puedes usar los scripts automáticos:
		 - Windows: `npm run db:setup:win` (ejecuta `backend/db_setup.ps1`)
		 - Linux/macOS: `npm run db:setup:unix` (ejecuta `backend/db_setup.sh`)
	 - O manualmente:
		 ```bash
		 createdb -h <host> -p <port> -U <usuario> <nombre_bd>
		 psql -h <host> -p <port> -U <usuario> -d <nombre_bd> -f backend/postgres_schema.sql
		 ```

4. **Crear un usuario administrador**:
	 - Puedes usar el script `backend/scripts/create_admin.js` o insertar manualmente en la base de datos (ver ejemplo en el esquema SQL).

## Ejecución

- **Backend**:
	```bash
	cd backend
	npm run start
	```
- **Frontend** (recomendado usar `live-server`):
	```bash
	live-server frontend --port=3000 --host=127.0.0.1
	```
- **Modo desarrollo (ambos a la vez)**:
	```bash
	npm run dev
	```

Por defecto:
- Backend: http://localhost:5000
- Frontend: http://127.0.0.1:3000

## Endpoints principales

- `POST /api/auth/register` — Registro de usuario
- `POST /api/auth/login` — Login y obtención de JWT
- `GET /api/reports/public` — Listado público de incidencias para el mapa
- `GET /api/reports/export?format=excel|pdf` — Exportar reportes (admin/autoridad)
- `GET/PUT /api/users/profile` — Perfil de usuario

## Flujo de autenticación

1. Realiza login en `/api/auth/login` con correo y contraseña. Obtendrás un token JWT.
2. Usa el token en el header `Authorization: Bearer <token>` para acceder a rutas protegidas.
3. El frontend almacena el token en `localStorage` y lo usa automáticamente.

## Exportación de reportes

Desde el panel de administrador (`frontend/admin-dashboard.html`) puedes exportar reportes en Excel o PDF usando el JWT. El botón de exportar realiza una petición autenticada a `/api/reports/export`.

## Páginas principales del cliente

- `citizen-map.html`: Mapa ciudadano (Leaflet, incidencias públicas)
- `citizen-new-report.html`: Reportar nueva incidencia
- `admin-dashboard.html`: Panel de administración y exportación
- `login.html` / `register.html`: Autenticación

## Notas y recomendaciones

- Asegúrate de tener `backend/.env` correctamente configurado.
- Si no ves incidencias en el mapa, crea algunas desde el frontend o inserta datos de prueba.
- El flujo de recuperación de contraseña está simulado en local.
- Consulta `TODO_NOTES.md` para mejoras y tareas pendientes.

---

Desarrollado para fines académicos. Si tienes dudas o sugerencias, revisa el código y los comentarios en cada archivo.

---

**Instalación y configuración (resumen)**

1. Instalar dependencias (desde la raíz):

```powershell
npm install
cd backend
npm install
cd ..
```

2. Configurar variables de entorno para el backend:

- Copia `backend/.env.example` a `backend/.env` y edítalo con tus credenciales:

```powershell
copy backend\.env.example backend\.env    # Windows (PowerShell)
```

- Variables mínimas en `backend/.env`:
	- `DB_HOST` (ej. localhost)
	- `DB_PORT` (ej. 5432)
	- `DB_USER` (usuario Postgres)
	- `DB_PASSWORD` (contraseña)
	- `DB_DATABASE` (nombre de la BD)
	- `JWT_SECRET` (secreto para tokens JWT)

3. Crear la base de datos y aplicar el esquema (desde una shell con `psql`):

```bash
# crea la base (si no existe)
createdb -h <host> -p <port> -U <usuario> <nombre_bd>

# aplicar el esquema SQL
psql -h <host> -p <port> -U <usuario> -d <nombre_bd> -f backend/postgres_schema.sql
```

Alternativa en Windows PowerShell con psql:

```powershell
# psql -h localhost -U postgres -d proyecto_incidentes -f backend/postgres_schema.sql
```

4. (Opcional) usar los scripts incluidos para crear usuario y aplicar esquema:

- `npm run db:setup:win` — ejecuta `backend/db_setup.ps1` (Windows)
- `npm run db:setup:unix` — ejecuta `backend/db_setup.sh` (Linux/macOS)

---

**Crear un usuario admin**

Puedes crear el `admin` de dos maneras:

- A) Usar la ruta de registro pública (si está habilitada): abre `frontend/register.html` y registra una cuenta. Luego actualiza su rol en la base de datos a `admin`.

- B) Insertar directamente en la base de datos (recomendado si quieres control inmediato). Para ello necesitas la contraseña hasheada con `bcrypt`. Ejemplo de cómo generar el hash desde `backend` (asegúrate de haber ejecutado `npm install` en `backend`):

```bash
cd backend
node -e "const bcrypt=require('bcrypt');(async()=>console.log(await bcrypt.hash('admin123',10)))()"
```

Esto imprimirá un hash como `$2b$10$...`. Usa ese valor en la consulta SQL:

```sql
INSERT INTO "Users" ("name","correoElectronico","password","rol","createdAt","updatedAt")
VALUES ('Admin','admin@gmail.com','$2b$10$HASH_GENERADO','admin',NOW(),NOW());
```

Nota: el nombre exacto de la tabla y columnas depende del esquema generado por Sequelize; adapta la consulta si tu tabla tiene otro nombre o prefijos.

---

**Arrancar la aplicación**

- Ejecutar backend solo:

```bash
cd backend
npm run start
```

- Ejecutar frontend solo (usar `live-server` u otro servidor estático). Si `live-server` está instalado globalmente:

```bash
live-server frontend --port=3000 --host=127.0.0.1
```

- Ejecutar ambos en modo desarrollo (concurrently) desde la raíz si el `package.json` lo define:

```bash
npm run dev
```

Por defecto en desarrollo: backend escucha en `http://localhost:5000` y el frontend en `http://127.0.0.1:3000`.

---

**Cómo iniciar sesión (login)**

1) Endpoint de login:

- URL: `POST http://localhost:5000/api/auth/login`
- Body (JSON):

```json
{
	"correoElectronico": "admin@gmail.com",
	"password": "admin123"
}
```

2) Ejemplos de petición:

- Con `curl`:

```bash
curl -X POST http://localhost:5000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"correoElectronico":"admin@gmail.com","password":"admin123"}'
```

- Con PowerShell (Invoke-RestMethod):

```powershell
$body = @{ correoElectronico='admin@gmail.com'; password='admin123' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -Body $body -ContentType 'application/json'
```

Respuesta: el servidor devuelve un JSON con un `token` JWT. Guarda ese token para peticiones que requieren autorización.

---

**Rutas importantes (resumen)**

- `POST /api/auth/register` — registrar usuario (si está habilitado).
- `POST /api/auth/login` — obtener JWT.
- `POST /api/auth/forgot` — iniciar flujo de recuperación (simulado en desarrollo).
- `GET /api/reports/public` — lista pública mínima para el mapa (lat/lon, título, estado, imágenes).
- `GET /api/reports/export?format=excel|pdf` — exportar reportes (restringido: roles `admin` o `autoridad`).

Para probar el endpoint de export desde PowerShell (descargar archivo):

```powershell
# suponiendo $token contiene el JWT
try {
	Invoke-RestMethod -Uri "http://localhost:5000/api/reports/export?format=excel" -Method GET -Headers @{ Authorization = "Bearer $token" } -OutFile reportes.xlsx -ErrorAction Stop
	Write-Output 'EXPORT_OK: reportes.xlsx creado'
} catch {
	Write-Output "EXPORT_ERROR: $($_.Exception.Message)"
}
```

---

**Páginas cliente relevantes**

- Mapa ciudadano: `frontend/citizen-map.html` (Leaflet, centrado en Cusco y carga marcadores desde `/api/reports/public`).
- Nueva denuncia: `frontend/citizen-new-report.html` (la UI oculta el formulario para usuarios no autorizados en desarrollo).
- Panel administrador: `frontend/admin-dashboard.html` (puedes añadir botón para exportar usando el JWT).

---

**Notas y recomendaciones**

- Asegúrate de que `backend/.env` esté correctamente configurado antes de arrancar el servidor.
- Si no aparecen marcadores en el mapa, la base de datos probablemente no contiene reportes; crea algunos para probar o ejecuta un pequeño script de seed.
- El flujo de recuperación de contraseña (`/api/auth/forgot`) en el entorno local está simulado y no envía correos reales a menos que configures un proveedor SMTP o Cloudinary según `backend/config/cloudinary.js`.

Si quieres, puedo:
- Añadir un botón de export en `frontend/admin-dashboard.html` que use el JWT y descargue el Excel/PDF.
- Crear un script de `seed` para generar reportes de ejemplo.


