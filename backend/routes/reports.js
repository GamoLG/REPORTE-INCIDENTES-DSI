const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware de autenticación y autorización
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Configuración de Multer para almacenamiento local
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes.'), false);
        }
    }
});

// @route   POST /api/reports
// @desc    Crear un nuevo reporte con subida de imágenes
// @access  Private (Ciudadano)
router.post('/', auth('ciudadano'), upload.array('fotografias', 5), async (req, res) => {
    const { titulo, descripcion, categoria, latitud, longitud, direccion, distrito } = req.body;
    const ciudadano_id = req.user.id;
    const fotos = req.files; // Archivos subidos por Multer

    try {
        const uploadedImageUrls = [];
        if (fotos && fotos.length > 0) {
            for (const foto of fotos) {
                // Guardar la ruta relativa para servir luego
                const relativePath = 'uploads/' + path.basename(foto.path);
                uploadedImageUrls.push({ url: relativePath });
            }
        }

        const Report = db.Report;
        const Image = db.Image;

        const created = await Report.create({ ciudadano_id, titulo, descripcion, categoria, latitud, longitud, direccion, distrito });
        if (uploadedImageUrls.length > 0) {
            for (const img of uploadedImageUrls) {
                await Image.create({ incidencia_id: created.id, url: img.url, tipo: 'incidencia' });
            }
        }

        const reportWithImages = await Report.findByPk(created.id, { include: [{ model: Image, as: 'imagenes' }] });
        res.json(reportWithImages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/public
// @desc    Obtener reportes públicos para mostrar en el mapa (sin auth)
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const reports = await db.Report.findAll({
            attributes: ['id','titulo','descripcion','categoria','latitud','longitud','estado','distrito','created_at'],
            include: [{ model: db.Image, as: 'imagenes', attributes: ['url'] }],
            order: [['created_at','DESC']]
        });

        const data = reports.map(r => ({
            id: r.id,
            titulo: r.titulo,
            descripcion: r.descripcion,
            categoria: r.categoria,
            latitud: Number(r.latitud),
            longitud: Number(r.longitud),
            estado: r.estado,
            distrito: r.distrito,
            created_at: r.created_at,
            imagenes: r.imagenes ? r.imagenes.map(i => i.url) : []
        }));

        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/export
// @desc    Exportar reportes a excel o pdf (solo admin/autoridad)
// @access  Private (Admin, Autoridad)
router.get('/export', auth(['admin','autoridad']), async (req, res) => {
    try {
        const format = (req.query.format || 'excel').toLowerCase();
        const reports = await db.Report.findAll({ include: [{ model: db.User, as: 'ciudadano', attributes: ['nombre_completo','correo_electronico'] }, { model: db.Image, as: 'imagenes', attributes: ['url'] }] });

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Reportes');
            sheet.columns = [
                { header: 'ID', key: 'id', width: 8 },
                { header: 'Titulo', key: 'titulo', width: 40 },
                { header: 'Descripcion', key: 'descripcion', width: 60 },
                { header: 'Categoria', key: 'categoria', width: 25 },
                { header: 'Distrito', key: 'distrito', width: 20 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Ciudadano', key: 'ciudadano', width: 30 },
                { header: 'Fecha', key: 'created_at', width: 20 }
            ];

            reports.forEach(r => {
                sheet.addRow({ id: r.id, titulo: r.titulo, descripcion: r.descripcion || '', categoria: r.categoria, distrito: r.distrito, estado: r.estado, ciudadano: r.ciudadano ? r.ciudadano.nombre_completo : '', created_at: r.created_at });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=reportes.xlsx');
            return res.send(buffer);
        } else if (format === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=reportes.pdf');

            const doc = new PDFDocument({ margin: 30 });
            doc.pipe(res);
            doc.fontSize(18).text('Reporte de Incidencias', { align: 'center' });
            doc.moveDown();

            reports.forEach(r => {
                doc.fontSize(12).text(`ID: ${r.id} | Titulo: ${r.titulo}`);
                doc.fontSize(10).text(`Categoria: ${r.categoria} | Distrito: ${r.distrito} | Estado: ${r.estado}`);
                doc.fontSize(10).text(`Ciudadano: ${r.ciudadano ? r.ciudadano.nombre_completo : 'N/A'} | Fecha: ${r.created_at}`);
                doc.moveDown();
            });

            doc.end();
            return;
        } else {
            return res.status(400).json({ msg: 'Formato inválido. Use excel o pdf.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports
// @desc    Obtener todos los reportes (para admin/autoridad) o reportes del usuario (para ciudadano) con filtros y búsqueda
// @access  Private (Admin, Autoridad, Ciudadano)
router.get('/', auth(), async (req, res) => {
    try {
        const { estado, categoria, distrito, search, limit } = req.query;
        const Report = db.Report;
        const Image = db.Image;
        const User = db.User;

        const where = {};
        if (req.user.rol === 'ciudadano') where.ciudadano_id = req.user.id;
        if (estado && estado !== 'Todos') where.estado = estado;
        if (categoria) where.categoria = categoria;
        if (distrito) where.distrito = distrito;
        if (search) where[db.sequelize.Op.or] = [
            { titulo: { [db.sequelize.Op.like]: `%${search}%` } },
            { descripcion: { [db.sequelize.Op.like]: `%${search}%` } }
        ];

        const reports = await Report.findAll({
            where,
            include: [
                { model: User, as: 'ciudadano', attributes: ['nombre_completo'] },
                { model: User, as: 'asignado', attributes: ['nombre_completo'] },
                { model: Image, as: 'imagenes', attributes: ['url'] }
            ],
            order: [['created_at', 'DESC']],
            limit: limit ? Number(limit) : undefined
        });

        // Normalizar la respuesta para el frontend
        const data = reports.map(r => ({
            id: r.id,
            titulo: r.titulo,
            descripcion: r.descripcion,
            categoria: r.categoria,
            distrito: r.distrito,
            direccion: r.direccion,
            estado: r.estado,
            created_at: r.created_at,
            fotografias: r.imagenes ? r.imagenes.map(img => ({ url: img.url })) : [],
            asignado_a_nombre: r.asignado ? r.asignado.nombre_completo : null,
            ciudadano_nombre: (r.ciudadano && r.ciudadano.nombre_completo) ? r.ciudadano.nombre_completo : ''
        }));

        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/:id
// @desc    Obtener un reporte por ID
// @access  Private (Admin, Autoridad, Ciudadano - si es su reporte)
router.get('/:id', auth(), async (req, res) => {
    const { id } = req.params;
    try {
        const report = await db.Report.findByPk(id, {
            include: [
                { model: db.User, as: 'ciudadano', attributes: ['nombre_completo','correo_electronico'] },
                { model: db.User, as: 'asignado', attributes: ['nombre_completo','cargo'] },
                { model: db.Image, as: 'imagenes' },
                { model: db.Comment, as: 'comentarios', include: [{ model: db.User, as: 'usuario', attributes: ['nombre_completo'] }] },
                { model: db.Historial, as: 'historial', include: [{ model: db.User, as: 'usuario_hist', attributes: ['nombre_completo'] }] }
            ]
        });

        if (!report) return res.status(404).json({ msg: 'Reporte no encontrado o no autorizado' });
        if (req.user.rol === 'ciudadano' && report.ciudadano_id !== req.user.id) return res.status(403).json({ msg: 'No autorizado' });
        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/reports/:id/assign
// @desc    Asignar un reporte a una autoridad
// @access  Private (Admin, Autoridad)
router.put('/:id/assign', auth(['admin', 'autoridad']), async (req, res) => {
    const { id } = req.params;
    const { asignado_id } = req.body; // ID de la autoridad a asignar

    try {
        const Report = db.Report;
        const Historial = db.Historial;
        await Report.update({ asignado_id, estado: 'En proceso' }, { where: { id } });
        await Historial.create({ incidencia_id: id, usuario_id: req.user.id, estado_nuevo: 'En proceso', comentarios: `Reporte asignado a la autoridad con ID: ${asignado_id}.` });
        // Buscar el reporte actualizado con las relaciones completas
        const updated = await Report.findByPk(id, {
            include: [
                { model: db.User, as: 'ciudadano', attributes: ['nombre_completo'] },
                { model: db.User, as: 'asignado', attributes: ['nombre_completo', 'cargo'] },
                { model: db.Image, as: 'imagenes' }
            ]
        });
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/reports/:id/status
// @desc    Actualizar el estado de un reporte y añadir evidencia de resolución
// @access  Private (Admin, Autoridad)
router.put('/:id/status', auth(['admin', 'autoridad']), upload.array('evidencia_resolucion_fotografias', 5), async (req, res) => {
    const { id } = req.params;
    const { estado, evidencia_resolucion_descripcion } = req.body;
    const fotosEvidencia = req.files; // Archivos de evidencia subidos por Multer

    try {
        const uploadedEvidenceImageUrls = [];
        if (fotosEvidencia && fotosEvidencia.length > 0) {
            for (const foto of fotosEvidencia) {
            // Multer is configured with diskStorage, so foto.buffer is not available.
            // Assuming local storage for evidence images, similar to initial report images.
            const relativePath = 'uploads/' + path.basename(foto.path);
            uploadedEvidenceImageUrls.push({ url: relativePath });
            }
        }

        const Report = db.Report;
        const Historial = db.Historial;
    await Report.update({ estado, evidencia_resolucion_descripcion: evidencia_resolucion_descripcion || null, updated_at: new Date() }, { where: { id } });

        if (uploadedEvidenceImageUrls.length > 0) {
            for (const img of uploadedEvidenceImageUrls) {
                await db.Image.create({ incidencia_id: id, url: img.url, public_id: img.public_id, tipo: 'resolucion' });
            }
        }

        await Historial.create({ incidencia_id: id, usuario_id: req.user.id, estado_nuevo: estado, comentarios: `Estado actualizado a: ${estado}. ${evidencia_resolucion_descripcion || ''}` });
        const updated = await Report.findByPk(id);
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/reports/:id/comment
// @desc    Añadir un comentario a un reporte
// @access  Private
router.post('/:id/comment', auth(), async (req, res) => {
    const { id } = req.params;
    const { contenido } = req.body;
    const usuario_id = req.user.id;

    try {
        const Comment = db.Comment;
        const created = await Comment.create({ incidencia_id: id, usuario_id, contenido });
        const comment = await Comment.findByPk(created.id, { include: [{ model: db.User, as: 'usuario', attributes: ['nombre_completo'] }] });
        res.json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/reports/:id/rate
// @desc    Calificar un reporte (por ciudadano)
// @access  Private (Ciudadano)
router.put('/:id/rate', auth('ciudadano'), async (req, res) => {
    const { id } = req.params;
    const { calificacion } = req.body;
    const ciudadano_id = req.user.id;

    try {
        const Report = db.Report;
        await Report.update({ calificacion_ciudadano: calificacion }, { where: { id, ciudadano_id } });
        const rows = await Report.findAll({ where: { id, ciudadano_id } });
        if (rows.length === 0) return res.status(404).json({ msg: 'Reporte no encontrado o no autorizado para calificar' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/statistics
// @desc    Obtener estadísticas generales de reportes
// @access  Private (Admin, Autoridad)
router.get('/statistics', auth(['admin', 'autoridad']), async (req, res) => {
    try {
        const Report = db.Report;
        const total = await Report.count();
        const pendiente = await Report.count({ where: { estado: 'Pendiente' } });
        const enProceso = await Report.count({ where: { estado: 'En proceso' } });
        const enEspera = await Report.count({ where: { estado: 'En espera' } });
        const resuelto = await Report.count({ where: { estado: 'Resuelto' } });
        const cerrado = await Report.count({ where: { estado: 'Cerrado' } });

        res.json({ total, pendiente, enProceso, enEspera, resuelto, cerrado });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/category-distribution
// @desc    Obtener la distribución de reportes por categoría
// @access  Private (Admin, Autoridad)
router.get('/category-distribution', auth(['admin', 'autoridad']), async (req, res) => {
    try {
        const Report = db.Report;
        const categoriesRaw = await Report.findAll({ attributes: ['categoria', [db.sequelize.fn('COUNT', db.sequelize.col('categoria')), 'count']], group: ['categoria'], order: [[db.sequelize.literal('count'),'DESC']] });
        const categories = categoriesRaw.map(r => ({ categoria: r.categoria, count: Number(r.dataValues.count) }));
        res.json(categories);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/status-distribution
// @desc    Obtener la distribución de reportes por estado
// @access  Private (Admin, Autoridad)
router.get('/status-distribution', auth(['admin', 'autoridad']), async (req, res) => {
    try {
        const Report = db.Report;
        const statusesRaw = await Report.findAll({ attributes: ['estado', [db.sequelize.fn('COUNT', db.sequelize.col('estado')), 'count']], group: ['estado'], order: [[db.sequelize.literal('count'),'DESC']] });
        const statuses = statusesRaw.map(r => ({ estado: r.estado, count: Number(r.dataValues.count) }));
        res.json(statuses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/district-distribution
// @desc    Obtener la distribución de reportes por distrito
// @access  Private (Admin, Autoridad)
router.get('/district-distribution', auth(['admin', 'autoridad']), async (req, res) => {
    try {
        const Report = db.Report;
        const districtsRaw = await Report.findAll({ attributes: ['distrito', [db.sequelize.fn('COUNT', db.sequelize.col('distrito')), 'count']], group: ['distrito'], order: [[db.sequelize.literal('count'),'DESC']] });
        const districts = districtsRaw.map(r => ({ distrito: r.distrito, count: Number(r.dataValues.count) }));
        res.json(districts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/recent
// @desc    Obtener los reportes más recientes
// @access  Private (Admin, Autoridad, Ciudadano)
router.get('/recent', auth(), async (req, res) => {
    const limit = req.query.limit || 5;
    try {
        const Report = db.Report;
        const where = {};
        if (req.user.rol === 'ciudadano') where.ciudadano_id = req.user.id;
        const recentReports = await Report.findAll({ where, include: [{ model: db.Image, as: 'imagenes' }, { model: db.User, as: 'ciudadano', attributes: ['nombre_completo'] }, { model: db.User, as: 'asignado', attributes: ['nombre_completo'] }], order: [['created_at','DESC']], limit: Number(limit) });
        res.json(recentReports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/reports/authorities
// @desc    Obtener la lista de autoridades para asignar reportes
// @access  Private (Admin, Autoridad)
router.get('/authorities', auth(['admin', 'autoridad']), async (req, res) => {
    try {
        const User = db.User;
        const authorities = await User.findAll({ where: { rol: 'autoridad' }, attributes: ['id','nombre_completo','cargo'], order: [['nombre_completo','ASC']] });
        res.json(authorities);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;