const { Pool } = require('pg');
require('dotenv').config();

const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_DATABASE || 'proyecto_incidentes',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    max: 10,
    idleTimeoutMillis: 30000
});

// Wrapper para mantener compatibilidad con llamadas tipo mysql2 (devuelven [rows, fields])
const pool = {
    query: async (text, params) => {
        const res = await pgPool.query(text, params);
        return [res.rows, res.fields];
    },
    _raw: pgPool
};

module.exports = pool;

