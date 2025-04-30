const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  restaurante_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurante',
    required: true,
    index: true
  },
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  disponible: {
    type: Boolean,
    default: true
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: -1
  }
});

// Índice compuesto para evitar duplicados por restaurante y nombre
menuSchema.index({ restaurante_id: 1, nombre: 1 }, { unique: true });

const Menu = mongoose.model('Menu', menuSchema);
module.exports = Menu;
