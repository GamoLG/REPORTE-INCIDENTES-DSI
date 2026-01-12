# Uso: .\backend\db_setup.ps1
# Crea el usuario, otorga permisos y aplica el esquema usando el nuevo usuario (Windows/PowerShell).

param()

$DB_NAME = Read-Host "Nombre de la base de datos (proyecto_incidentes)"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = 'proyecto_incidentes' }
$DB_USER = Read-Host "Nombre de usuario a crear (proyecto_user)"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = 'proyecto_user' }

Write-Host "Introduce la contraseña para $DB_USER (se usará temporalmente en PGPASSWORD)."
$secure = Read-Host -AsSecureString "Contraseña"
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

# Crear rol/usuario con el superusuario 'postgres' (te pedirá la contraseña de postgres si no está configurada unattended)
& psql -h localhost -U postgres -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$Plain'" 2>$null
& psql -h localhost -U postgres -c "GRANT CONNECT ON DATABASE $DB_NAME TO $DB_USER" 2>$null
& psql -h localhost -U postgres -d $DB_NAME -c "GRANT USAGE ON SCHEMA public TO $DB_USER" 2>$null
& psql -h localhost -U postgres -d $DB_NAME -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $DB_USER" 2>$null
& psql -h localhost -U postgres -d $DB_NAME -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DB_USER" 2>$null

# Ejecutar esquema con el nuevo usuario usando PGPASSWORD temporal
$env:PGPASSWORD = $Plain
& psql -h localhost -U $DB_USER -d $DB_NAME -f "backend/postgres_schema.sql"
Remove-Item env:PGPASSWORD

Write-Host "Hecho: usuario creado (o existía) y esquema aplicado en $DB_NAME."