const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Historial = sequelize.define('Historial', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    incidencia_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER },
    estado_nuevo: { type: DataTypes.STRING(50) },
    comentarios: { type: DataTypes.TEXT }
  }, {
    tableName: 'historial_incidencias',
    timestamps: true,
    createdAt: 'fecha_cambio',
    updatedAt: false
  });

  return Historial;
};
