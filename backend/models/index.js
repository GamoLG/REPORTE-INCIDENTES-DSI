const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_DATABASE || 'proyecto_incidentes', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || '', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    timestamps: true
  }
});

const db = { sequelize };

db.User = require('./User')(sequelize);
db.Report = require('./Report')(sequelize);
db.Image = require('./Image')(sequelize);
db.Comment = require('./Comment')(sequelize);
db.Historial = require('./Historial')(sequelize);

// Associations
db.User.hasMany(db.Report, { foreignKey: 'ciudadano_id', as: 'reports' });
db.Report.belongsTo(db.User, { foreignKey: 'ciudadano_id', as: 'ciudadano' });

db.User.hasMany(db.Comment, { foreignKey: 'usuario_id', as: 'comments' });
db.Comment.belongsTo(db.User, { foreignKey: 'usuario_id', as: 'usuario' });

db.Report.hasMany(db.Image, { foreignKey: 'incidencia_id', as: 'imagenes' });
db.Image.belongsTo(db.Report, { foreignKey: 'incidencia_id', as: 'incidencia' });

db.Report.hasMany(db.Comment, { foreignKey: 'incidencia_id', as: 'comentarios' });
db.Comment.belongsTo(db.Report, { foreignKey: 'incidencia_id', as: 'incidencia' });

db.Report.hasMany(db.Historial, { foreignKey: 'incidencia_id', as: 'historial' });
db.Historial.belongsTo(db.Report, { foreignKey: 'incidencia_id', as: 'incidencia' });

db.User.hasMany(db.Historial, { foreignKey: 'usuario_id', as: 'historial_usuario' });
db.Historial.belongsTo(db.User, { foreignKey: 'usuario_id', as: 'usuario_hist' });

// Asignado (authority) relation
db.User.hasMany(db.Report, { foreignKey: 'asignado_id', as: 'assignedReports' });
db.Report.belongsTo(db.User, { foreignKey: 'asignado_id', as: 'asignado' });

module.exports = db;
