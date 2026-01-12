const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comment = sequelize.define('Comment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    incidencia_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    contenido: { type: DataTypes.TEXT, allowNull: false }
  }, {
    tableName: 'comentarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Comment;
};
