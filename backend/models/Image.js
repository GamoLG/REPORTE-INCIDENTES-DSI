const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Image = sequelize.define('Image', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    incidencia_id: { type: DataTypes.INTEGER, allowNull: false },
    url: { type: DataTypes.STRING(500), allowNull: false },
    public_id: { type: DataTypes.STRING(255) },
    tipo: { type: DataTypes.ENUM('incidencia','resolucion'), allowNull: false, defaultValue: 'incidencia' }
  }, {
    tableName: 'imagenes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Image;
};
