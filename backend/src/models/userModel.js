const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    index: true // Índice simple para búsquedas
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, 
    index: true // Índice único
  },
  ubicacion: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      required: true,
      index: '2dsphere' // Índice geoespacial
    }
  },
  fechaRegistro: { 
    type: Date, 
    default: Date.now,
    index: -1 // Índice descendente
  },
  edad: { 
    type: Number, 
    required: true,
    min: 18,
    max: 70,
    index: 1 
  },
  genero: { 
    type: String, 
    required: true,
    enum: ['masculino', 'femenino'],
    index: true 
  }
});

// Índice compuesto: edad + género
usuarioSchema.index({ edad: 1, genero: 1 });

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;