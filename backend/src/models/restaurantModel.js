const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    index: true 
  },
  direccion: { 
    type: String, 
    required: true,
    index: true 
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
      index: '2dsphere'
    }
  },
  categorias: { 
    type: [String], 
    required: true,
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: -1 
  }
});

// Índice compuesto para evitar duplicados (nombre + dirección)
restaurantSchema.index({ nombre: 1, direccion: 1 }, { unique: true });

const Restaurante = mongoose.model('Restaurante', restaurantSchema);
module.exports = Restaurante;