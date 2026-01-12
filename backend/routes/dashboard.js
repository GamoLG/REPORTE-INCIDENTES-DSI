const express = require('express');
const auth = require('../middleware/auth');
const db = require('../models');
const router = express.Router();
// Obtener incidencias asignadas a la autoridad logueada
router.get('/mis-tareas', auth(['autoridad']), async (req, res) => {
    try {
        const Report = db.Report;
        const reports = await Report.findAll({
            where: { asignado_id: req.user.id },
            include: [
                { model: db.User, as: 'ciudadano', attributes: ['nombre_completo'] },
                { model: db.User, as: 'asignado', attributes: ['nombre_completo'] }
            ],
            order: [['created_at','DESC']]
        });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/dashboard-admin
// @desc    Obtener datos para el dashboard del administrador
// @access  Private (Admin y Autoridad)
router.get('/', auth(['admin', 'autoridad']), async (req, res) => {
    try {
        const Report = db.Report;
        let where = {};
        if (req.user.rol === 'autoridad') {
            where = { asignado_id: req.user.id };
        }

        // Totales filtrados
        const totalReports = await Report.count({ where });

        // Agrupaciones filtradas
        const reportsByStatusRaw = await Report.findAll({ attributes: ['estado', [db.sequelize.fn('COUNT', db.sequelize.col('estado')), 'count']], where, group: ['estado'] });
        const reportsByStatus = reportsByStatusRaw.map(r => ({ estado: r.estado, count: Number(r.dataValues.count) }));

        const reportsByCategoryRaw = await Report.findAll({ attributes: ['categoria', [db.sequelize.fn('COUNT', db.sequelize.col('categoria')), 'count']], where, group: ['categoria'] });
        const reportsByCategory = reportsByCategoryRaw.map(r => ({ categoria: r.categoria, count: Number(r.dataValues.count) }));

        const reportsByDistrictRaw = await Report.findAll({ attributes: ['distrito', [db.sequelize.fn('COUNT', db.sequelize.col('distrito')), 'count']], where, group: ['distrito'] });
        const reportsByDistrict = reportsByDistrictRaw.map(r => ({ distrito: r.distrito, count: Number(r.dataValues.count) }));

        // Reportes recientes filtrados
        let recentReports;
        if (req.user.rol === 'autoridad') {
            recentReports = await Report.findAll({
                where,
                include: [
                    { model: db.User, as: 'ciudadano', attributes: ['nombre_completo'] },
                    { model: db.User, as: 'asignado', attributes: ['nombre_completo'] }
                ],
                order: [['created_at','DESC']],
                limit: 5
            });
        } else {
            recentReports = await Report.findAll({
                include: [
                    { model: db.User, as: 'ciudadano', attributes: ['nombre_completo'] },
                    { model: db.User, as: 'asignado', attributes: ['nombre_completo'] }
                ],
                order: [['created_at','DESC']],
                limit: 5
            });
        }
        res.json({ totalReports, reportsByStatus, reportsByCategory, reportsByDistrict, recentReports });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;

