require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models');

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Evitar error 404 del favicon en los logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => res.send('API Proyecto Incidentes - backend'));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

async function start() {
	try {
		await db.sequelize.authenticate();
		console.log('Conectado a la base de datos');
		await db.sequelize.sync();
		app.listen(PORT, () => console.log(`Servidor backend escuchando en puerto ${PORT}`));
	} catch (err) {
		console.error('Error al iniciar el servidor:', err);
		process.exit(1);
	}
}

start();
