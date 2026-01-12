const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Conexión a MySQL
const db = require('../models');
const { Op } = require('sequelize');

// @route   POST /api/auth/register
// @desc    Register user (citizen or authority)
// @access  Public
router.post('/register', async (req, res) => {
    const { dni, nombreCompleto, correoElectronico, password, rol, cargo } = req.body;

    try {
        // Usar Sequelize para comprobar existencia y crear usuario
        const User = db.User;
        const existing = await User.findOne({ where: { [Op.or]: [{ correo_electronico: correoElectronico }, { dni }] } });
        if (existing) return res.status(400).json({ msg: 'El correo electrónico o DNI ya están registrados' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const created = await User.create({
            dni,
            nombre_completo: nombreCompleto,
            correo_electronico: correoElectronico,
            password_hash: passwordHash,
            rol: rol || 'ciudadano',
            cargo: rol === 'autoridad' ? cargo : null
        });

        const payload = { user: { id: created.id, rol: created.rol } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { correoElectronico, password } = req.body;

    try {
        const User = db.User;
        const userRow = await User.findOne({ where: { correo_electronico: correoElectronico } });
        if (!userRow) return res.status(400).json({ msg: 'Credenciales inválidas' });

        const isMatch = await bcrypt.compare(password, userRow.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const payload = { user: { id: userRow.id, rol: userRow.rol } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

// @route   POST /api/auth/forgot
// @desc    Solicitar recuperación de contraseña (simulado)
// @access  Public
router.post('/forgot', async (req, res) => {
    const { correoElectronico } = req.body;
    try {
        const User = db.User;
        const userRow = await User.findOne({ where: { correo_electronico: correoElectronico } });

        // No revelar si el usuario existe por razones de seguridad
        if (userRow) {
            console.log(`Solicitud de recuperación de contraseña para: ${correoElectronico}`);
            // Aquí podrías generar un token y enviar un correo real.
        }

        return res.json({ msg: 'Si existe la cuenta, se ha enviado un correo con instrucciones.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;

