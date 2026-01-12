#!/usr/bin/env bash
set -euo pipefail

# Uso: ./backend/db_setup.sh
# Crea el usuario, otorga permisos y aplica el esquema usando el nuevo usuario.

DB_NAME="proyecto_incidentes"
DB_USER="proyecto_user"
SCHEMA_FILE="backend/postgres_schema.sql"

read -p "Nombre de la base de datos [${DB_NAME}]: " input_db
DB_NAME="${input_db:-$DB_NAME}"
read -p "Nombre de usuario a crear [${DB_USER}]: " input_user
DB_USER="${input_user:-$DB_USER}"
read -sp "Contraseña para ${DB_USER}: " DB_PASS
echo

# Crear usuario (requiere permisos de superusuario). Si usas Linux con sudo:
if command -v sudo >/dev/null 2>&1; then
  sudo -u postgres psql -c "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}'" || true
  sudo -u postgres psql -c "GRANT CONNECT ON DATABASE ${DB_NAME} TO ${DB_USER};"
  sudo -u postgres psql -d "${DB_NAME}" -c "GRANT USAGE ON SCHEMA public TO ${DB_USER};"
  sudo -u postgres psql -d "${DB_NAME}" -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};"
  sudo -u postgres psql -d "${DB_NAME}" -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};"
else
  echo "No se encontró 'sudo'. Asegúrate de ejecutar las siguientes líneas como superusuario (postgres):"
  echo "psql -U postgres -c \"CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '<PASSWORD>'\""
  exit 1
fi

# Ejecutar el esquema con el nuevo usuario
export PGPASSWORD="$DB_PASS"
psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"
unset PGPASSWORD

echo "Hecho: usuario creado (o existía) y esquema aplicado en ${DB_NAME}."
