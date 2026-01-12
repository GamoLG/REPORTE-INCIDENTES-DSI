
Tareas pendientes / mejoras (prioritarias):
- Documentar endpoints (OpenAPI/Swagger).

# Problemas detectados

- [Perfil de usuario] Revisar y corregir el módulo de perfil para autoridades y administradores:
	- Actualmente, los datos del perfil no se muestran correctamente para estos roles.
	- Verificar que existan usuarios de tipo autoridad y admin en la base de datos.
	- Confirmar que el endpoint `/api/users/profile` retorna la información adecuada según el rol.
	- Revisar el frontend (profile.js) para asegurar que los campos del formulario se llenan correctamente para todos los roles.
	- Probar el flujo de login y visualización de perfil para cada tipo de usuario.

- Reescribir todas las rutas en `backend/routes/` para usar modelos Sequelize (`backend/models`) en lugar de `pool.query`.
- Añadir validación de entrada (`express-validator`) en endpoints críticos (`auth`, `reports`).
- Añadir manejo de transacciones donde corresponda (ej. crear reporte + subir imágenes).
- Confirmar el formato JSON devuelto por MySQL para campos agregados (JSON_ARRAYAGG) y parsearlo en backend antes de enviar al cliente si es necesario.
- Añadir pruebas unitarias/integración y CI.
- Añadir paginación en endpoints que devuelven listas largas (`/api/reports`).
- Mejorar seguridad: rate-limiting, helmet, sanitización.
- Añadir migraciones con Sequelize CLI si quieres versionar cambios al esquema.
- Documentar endpoints (OpenAPI/Swagger).
