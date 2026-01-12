const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ciudadano_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    categoria: {
      type: DataTypes.ENUM(
        'Basura acumulada','Alumbrado defectuoso','Semáforos dañados','Agujeros / baches en la vía','Robo / inseguridad','Mal estado de parques','Señalización caída','Ruidos molestos','Animales callejeros','Fugas de agua o alcantarillado','Otros'
      ),
      allowNull: false
    },
    latitud: {
      type: DataTypes.DECIMAL(10,7),
      allowNull: false
    },
    longitud: {
      type: DataTypes.DECIMAL(10,7),
      allowNull: false
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    distrito: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('Pendiente','En proceso','En espera','Resuelto','Cerrado'),
      allowNull: false,
      defaultValue: 'Pendiente'
    },
    asignado_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    evidencia_resolucion_descripcion: {
      type: DataTypes.TEXT
    },
    calificacion_ciudadano: {
      type: DataTypes.ENUM('Satisfecho','No satisfecho')
    }
  }, {
    tableName: 'incidencias',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Report;
};
