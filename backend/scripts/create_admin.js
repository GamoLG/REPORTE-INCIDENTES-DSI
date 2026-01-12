const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Crea un usuario admin si no existe. Uso directo de Sequelize para evitar cargar todo el app.
async function main() {
  const args = require('minimist')(process.argv.slice(2));
  const email = args.email || args.e || 'admin@gmail.com';
  const password = args.password || args.p || 'admin123';
  const dni = args.dni || '00000000';
  const nombre = args.nombre || 'Administrador';

  const sequelize = new Sequelize(process.env.DB_DATABASE || 'proyecto_incidentes', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    logging: false
  });

  // Definición mínima del modelo usuarios (solo campos necesarios)
  const User = sequelize.define('usuarios', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    dni: { type: Sequelize.STRING },
    nombre_completo: { type: Sequelize.STRING },
    correo_electronico: { type: Sequelize.STRING },
    password_hash: { type: Sequelize.STRING },
    rol: { type: Sequelize.STRING }
  }, { timestamps: false, underscored: true, tableName: 'usuarios' });

  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos');

    const existing = await User.findOne({ where: { correo_electronico: email } });
    if (existing) {
      console.log(`El usuario ${email} ya existe (id=${existing.id}).`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const created = await User.create({ dni, nombre_completo: nombre, correo_electronico: email, password_hash: passwordHash, rol: 'admin' });
    console.log('Usuario admin creado:', { id: created.id, email: created.correo_electronico });
    process.exit(0);
  } catch (err) {
    console.error('Error creando admin:', err);
    process.exit(1);
  }
}

main();
