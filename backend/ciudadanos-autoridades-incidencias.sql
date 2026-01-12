INSERT INTO usuarios (dni, nombre_completo, correo_electronico, password_hash, rol) VALUES
('70000001','Luis Alberto Torres','luis.torres@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000002','Rosa María Quispe','rosa.quispe@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000003','José Antonio Rojas','jose.rojas@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000004','Carmen Elena Huamán','carmen.huaman@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000005','Miguel Ángel Paredes','miguel.paredes@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000006','Paola Fernanda Soto','paola.soto@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000007','Jorge Luis Salazar','jorge.salazar@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000008','Diana Milagros Chávez','diana.chavez@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000009','Ricardo Manuel Cueva','ricardo.cueva@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000010','Lucía Andrea Mendoza','lucia.mendoza@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000011','Kevin Alejandro Ramos','kevin.ramos@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000012','Valeria Sofía Castro','valeria.castro@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000013','Andrés Felipe León','andres.leon@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000014','Natalia Verónica Peña','natalia.pena@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000015','Fernando Javier Ortiz','fernando.ortiz@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000016','Claudia Beatriz Navarro','claudia.navarro@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000017','Óscar Iván Medina','oscar.medina@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000018','Marisol Patricia Vega','marisol.vega@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000019','Henry Eduardo Campos','henry.campos@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano'),
('70000020','Fiorella Daniela Ríos','fiorella.rios@gmail.com',crypt('user123',gen_salt('bf')),'ciudadano');


INSERT INTO usuarios (dni, nombre_completo, correo_electronico, password_hash, rol, cargo) VALUES
('60000001','Carlos Alberto Ramírez','carlos.ramirez@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Servicios Públicos'),
('60000002','Ana Lucía Flores','ana.flores@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Seguridad Ciudadana'),
('60000003','Pedro Martín Valdez','pedro.valdez@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Infraestructura Vial'),
('60000004','Silvia Roxana Gutiérrez','silvia.gutierrez@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Alumbrado Público'),
('60000005','Marco Antonio Espinoza','marco.espinoza@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Gestión Ambiental'),
('60000006','Patricia Noemí León','patricia.leon@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Parques y Jardines'),
('60000007','Raúl Sebastián Núñez','raul.nunez@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Transporte Urbano'),
('60000008','Mónica Isabel Cabrera','monica.cabrera@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Fiscalización'),
('60000009','Víctor Hugo Palomino','victor.palomino@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Saneamiento'),
('60000010','Lorena Milagros Soto','lorena.soto@municipio.gob.pe',crypt('autoridad123',gen_salt('bf')),'autoridad','Atención Vecinal');

SELECT rol, COUNT(*) FROM usuarios GROUP BY rol;


INSERT INTO incidencias (
    ciudadano_id,
    titulo,
    descripcion,
    categoria,
    latitud,
    longitud,
    direccion,
    distrito
)
SELECT
    u.id,
    'Incidencia reportada en Cusco',
    'Incidencia creada por ciudadano desde la app.',
    (ARRAY[
        'Basura acumulada',
        'Alumbrado defectuoso',
        'Agujeros / baches en la vía',
        'Robo / inseguridad',
        'Mal estado de parques',
        'Señalización caída'
    ])[(random()*5)::int + 1]::categoria_type,
    -13.5319 + random()/500,
    -71.9675 + random()/500,
    'Av. El Sol',
    (ARRAY[
        'Cusco',
        'Santiago',
        'Wanchaq',
        'San Sebastián',
        'San Jerónimo'
    ])[(random()*4)::int + 1]
FROM usuarios u
WHERE u.rol = 'ciudadano'
LIMIT 30;



UPDATE incidencias
SET
    asignado_id = (
        SELECT id
        FROM usuarios
        WHERE rol = 'autoridad'
        ORDER BY random()
        LIMIT 1
    ),
    estado = 'En proceso'
WHERE estado = 'Pendiente';



INSERT INTO historial_incidencias (
    incidencia_id,
    usuario_id,
    estado_anterior,
    estado_nuevo,
    comentarios
)
SELECT
    i.id,
    (SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1),
    'Pendiente',
    'En proceso',
    'Incidencia asignada por el administrador'
FROM incidencias i
WHERE i.estado = 'En proceso';


UPDATE incidencias
SET
    estado = 'Resuelto',
    evidencia_resolucion_descripcion = 'Incidencia solucionada por el área correspondiente.'
WHERE id IN (
    SELECT id
    FROM incidencias
    WHERE estado = 'En proceso'
    ORDER BY random()
    LIMIT 10
);


INSERT INTO historial_incidencias (
    incidencia_id,
    usuario_id,
    estado_anterior,
    estado_nuevo,
    comentarios
)
SELECT
    i.id,
    i.asignado_id,
    'En proceso',
    'Resuelto',
    'Trabajo concluido por el encargado asignado'
FROM incidencias i
WHERE i.estado = 'Resuelto';


--consultas
SELECT id, titulo, distrito, created_at
FROM incidencias
WHERE estado = 'Pendiente';
---
SELECT i.id, u.nombre_completo AS encargado, i.estado
FROM incidencias i
JOIN usuarios u ON u.id = i.asignado_id;




