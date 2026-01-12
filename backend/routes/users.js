const express = require('express');
const router = express.Router();
const pool = require('../db');
const db = require('../models');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth'); // Middleware de autenticación y autorización

// @route   GET /api/users/profile
// @desc    Obtener perfil del usuario autenticado
// @access  Private
router.get('/profile', auth(), async (req, res) => {
    try {
        const User = db.User;
        const user = await User.findByPk(req.user.id, { attributes: ['id','dni','nombre_completo','correo_electronico','rol','cargo','foto_perfil_url'] });
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/users/profile
// @desc    Actualizar perfil del usuario autenticado
// @access  Private
router.put('/profile', auth(), async (req, res) => {
    const { nombreCompleto, correoElectronico, cargo, fotoPerfilUrl } = req.body;

    try {
        const User = db.User;
        await User.update({ nombre_completo: nombreCompleto, correo_electronico: correoElectronico, cargo: cargo || null, foto_perfil_url: fotoPerfilUrl || null }, { where: { id: req.user.id } });
        const updated = await User.findByPk(req.user.id, { attributes: ['id','nombre_completo','correo_electronico','rol','cargo','foto_perfil_url'] });
        if (!updated) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   PUT /api/users/change-password
// @desc    Cambiar contraseña del usuario autenticado
// @access  Private
router.put('/change-password', auth(), async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const User = db.User;
        const userRow = await User.findByPk(req.user.id);
        if (!userRow) return res.status(404).json({ msg: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(currentPassword, userRow.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Contraseña actual incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.update({ password_hash: hashedPassword }, { where: { id: req.user.id } });

        res.json({ msg: 'Contraseña actualizada exitosamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   GET /api/users/authorities
// @desc    Obtener lista de autoridades/encargados
// @access  Private (Admin, Autoridad)
router.get('/authorities', auth(['admin', 'autoridad']), async (req, res) => {
    try {
        const User = db.User;
        const authorities = await User.findAll({ where: { rol: 'autoridad' }, attributes: ['id','nombre_completo','cargo'] });
        res.json(authorities);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;
