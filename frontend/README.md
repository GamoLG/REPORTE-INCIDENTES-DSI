# Frontend - Sistema de Gestión de Incidencias

SPA ligera basada en HTML, CSS (Tailwind) y JavaScript puro, con migración progresiva a React.js.
Permite a ciudadanos, autoridades y administradores interactuar con el sistema de incidencias mediante dashboards, mapas y formularios.

## Puntos clave
- HTML5, CSS3 (Tailwind), JavaScript ES6+, React.js (en proceso)
- Mapas interactivos (Leaflet.js), gráficas (Chart.js)
- Consumo de API REST, autenticación y control de roles
- Perfiles dinámicos y exportación de reportes

Consulta detalles ampliados en [../readme-guia.md](../readme-guia.md).

## Estructura de carpetas
- `admin-dashboard.html` — Panel principal del administrador
- `citizen-dashboard.html` — Panel principal del ciudadano
- `admin-map.html`, `citizen-map.html` — Mapas de incidencias
- `admin-profile.html`, `citizen-profile.html` — Perfiles dinámicos
- `js/` — Scripts para mapas, dashboards, perfiles, autenticación
- `css/` — Estilos generales y específicos por rol

## Instalación y ejecución
1. Instala dependencias en la raíz del proyecto:
   ```bash
   npm install
   ```
2. Inicia el servidor estático recomendado:
   ```bash
   npm run frontend
   # o
   live-server frontend --port=3000 --host=127.0.0.1
   ```
3. Accede a `http://127.0.0.1:3000` en tu navegador.

## Funcionalidades principales
- **Dashboard con estadísticas:** métricas de reportes, gráficas por categoría, estado y distrito (Chart.js)
- **Mapa interactivo:** visualización de incidencias públicas con filtros y marcadores de colores (Leaflet)
- **Perfiles dinámicos:** carga de datos del usuario autenticado (ciudadano, autoridad, admin)
- **Exportación de reportes:** admins/autoridades pueden exportar a Excel/PDF desde el dashboard
- **Autenticación y roles:** login, registro, control de acceso por rol

## Ejemplo de uso (exportar reportes)
1. Inicia sesión como admin o autoridad
2. Ve a `admin-dashboard.html` y haz clic en "Exportar"
3. Selecciona PDF o Excel; el archivo se descarga automáticamente

## Estadísticas y ejemplos
- **Métricas en dashboard:**
  - Total de reportes
  - Pendientes, en proceso, resueltos
  - Gráficas por categoría, estado y distrito
- **Mapa:**
  - Marcadores de colores según estado
  - Filtros dinámicos por categoría, estado y distrito
- **Perfiles:**
  - Datos cargados dinámicamente vía JS desde `/api/users/profile`

## Notas y recomendaciones
- El frontend es estático, pero requiere el backend corriendo para consumir la API
- Si no ves datos, asegúrate de tener reportes y usuarios en la base de datos
- Consulta los scripts JS para personalizar la lógica de mapas, dashboards y perfiles

---

Para problemas conocidos y tareas, revisa [../TODO_NOTES.md](../TODO_NOTES.md).
Desarrollado para fines académicos. Consulta el código y los comentarios para más detalles.
