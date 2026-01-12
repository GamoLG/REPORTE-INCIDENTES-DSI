-- Esquema PostgreSQL para proyecto_incidentes (compatible con PostgreSQL 12+)
-- Ejecutar en la base de datos `proyecto_incidentes` o crear la DB antes.

-- Opcional: crear la base de datos (requiere permisos de superusuario)
-- CREATE DATABASE proyecto_incidentes WITH ENCODING='UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;

-- Tip: conectarse a la DB y ejecutar este archivo: psql -d proyecto_incidentes -f postgres_schema.sql

-- Tipos ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_type') THEN
        CREATE TYPE rol_type AS ENUM ('ciudadano','autoridad','admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_type') THEN
        CREATE TYPE categoria_type AS ENUM (
            'Basura acumulada','Alumbrado defectuoso','Semáforos dañados','Agujeros / baches en la vía',
            'Robo / inseguridad','Mal estado de parques','Señalización caída','Ruidos molestos','Animales callejeros',
            'Fugas de agua o alcantarillado','Otros'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_type') THEN
        CREATE TYPE estado_type AS ENUM ('Pendiente','En proceso','En espera','Resuelto','Cerrado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calificacion_type') THEN
        CREATE TYPE calificacion_type AS ENUM ('Satisfecho','No satisfecho');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'imagen_tipo') THEN
        CREATE TYPE imagen_tipo AS ENUM ('incidencia','resolucion');
    END IF;
END$$;

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_type NOT NULL DEFAULT 'ciudadano',
    cargo VARCHAR(100),
    foto_perfil_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla incidencias
CREATE TABLE IF NOT EXISTS incidencias (
    id SERIAL PRIMARY KEY,
    ciudadano_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria categoria_type NOT NULL,
    latitud NUMERIC(10,7) NOT NULL,
    longitud NUMERIC(10,7) NOT NULL,
    direccion TEXT NOT NULL,
    distrito VARCHAR(100) NOT NULL,
    estado estado_type NOT NULL DEFAULT 'Pendiente',
    asignado_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    evidencia_resolucion_descripcion TEXT,
    calificacion_ciudadano calificacion_type DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla imagenes
CREATE TABLE IF NOT EXISTS imagenes (
    id SERIAL PRIMARY KEY,
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    public_id VARCHAR(255),
    tipo imagen_tipo NOT NULL DEFAULT 'incidencia',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla historial_incidencias
CREATE TABLE IF NOT EXISTS historial_incidencias (
    id SERIAL PRIMARY KEY,
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    comentarios TEXT,
    fecha_cambio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla comentarios
CREATE TABLE IF NOT EXISTS comentarios (
    id SERIAL PRIMARY KEY,
    incidencia_id INTEGER NOT NULL REFERENCES incidencias(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    incidencia_id INTEGER REFERENCES incidencias(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias (estado);
CREATE INDEX IF NOT EXISTS idx_incidencias_categoria ON incidencias (categoria);
CREATE INDEX IF NOT EXISTS idx_incidencias_distrito ON incidencias (distrito);
CREATE INDEX IF NOT EXISTS idx_incidencias_ciudadano ON incidencias (ciudadano_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_asignado ON incidencias (asignado_id);
CREATE INDEX IF NOT EXISTS idx_imagenes_incidencia ON imagenes (incidencia_id);
CREATE INDEX IF NOT EXISTS idx_hist_incidencia ON historial_incidencias (incidencia_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_incidencia ON comentarios (incidencia_id);
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones (usuario_id);

-- Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_usuarios BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_incidencias BEFORE UPDATE ON incidencias FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Vista de resumen
CREATE OR REPLACE VIEW vw_incidencia_resumen AS
SELECT
  i.id,
  i.titulo,
  i.distrito,
  i.categoria,
  i.estado,
  i.created_at,
  u.nombre_completo AS ciudadano_nombre,
  (SELECT COUNT(*) FROM imagenes im WHERE im.incidencia_id = i.id AND im.tipo = 'incidencia') AS fotos_count
FROM incidencias i
LEFT JOIN usuarios u ON u.id = i.ciudadano_id;

-- Notas:
-- 1) Use la inicialización del backend (server.js) para crear el usuario admin con bcrypt.
-- 2) Si desea funciones geoespaciales avanzadas, instale PostGIS y añada una columna geometry.
-- 3) Para migrar datos desde MySQL, exporte y transforme tipos ENUM y AUTO_INCREMENT a SERIAL.


SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
	
SELECT 1;
SELECT current_user;

---creando administrador

CREATE EXTENSION IF NOT EXISTS pgcrypto;


INSERT INTO usuarios (
    dni,
    nombre_completo,
    correo_electronico,
    password_hash,
    rol,
    cargo
) VALUES (
    '00000000',
    'Administrador General',
    'admin@gmail.com',
    crypt('admin123', gen_salt('bf')),
    'admin',
    'Administrador del sistema'
);



-- modificar incidentes
UPDATE incidencias
SET categoria = (
    SELECT categoria_enum FROM (
        SELECT unnest(ARRAY[
            'Basura acumulada'::categoria_type,
            'Alumbrado defectuoso'::categoria_type,
            'Agujeros / baches en la vía'::categoria_type,
            'Robo / inseguridad'::categoria_type,
            'Mal estado de parques'::categoria_type,
            'Señalización caída'::categoria_type
        ]) AS categoria_enum
        ORDER BY random()
        LIMIT 1
    ) AS sub
)
WHERE categoria IS NULL;

SELECT COUNT(*) FROM incidencias WHERE categoria IS NULL;