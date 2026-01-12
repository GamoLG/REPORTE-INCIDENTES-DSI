const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // Obtener token del header: soporte para 'x-auth-token' y 'Authorization: Bearer <token>'
        let token = req.header('x-auth-token');
        if (!token) {
            const authHeader = req.header('authorization') || req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        // Verificar si no hay token
        if (!token) {
            return res.status(401).json({ msg: 'No hay token, autorización denegada' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.user;

            // Verificar roles
            if (roles.length > 0 && !roles.includes(req.user.rol)) {
                return res.status(403).json({ msg: 'Acceso no autorizado: rol insuficiente' });
            }

            next();
        } catch (err) {
            res.status(401).json({ msg: 'Token no válido' });
        }
    };
};

