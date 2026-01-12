const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    nombre_completo: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    correo_electronico: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol: {
      type: DataTypes.ENUM('ciudadano','autoridad','admin'),
      allowNull: false,
      defaultValue: 'ciudadano'
    },
    cargo: {
      type: DataTypes.STRING(100)
    },
    foto_perfil_url: {
      type: DataTypes.STRING(255)
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};
