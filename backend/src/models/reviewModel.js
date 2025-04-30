const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  restaurante_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurante',
    required: true,
    index: true
  },
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    set: v => Math.round(v * 10) / 10 // Redondear a 1 decimal
  },
  comentario: {
    type: String,
    required: true,
    maxlength: 500
  },
  fecha: {
    type: Date,
    default: Date.now,
    index: -1
  }
});

// Índice compuesto para evitar múltiples reseñas de un mismo usuario en un restaurante
reviewSchema.index({ usuario_id: 1, restaurante_id: 1 }, { unique: true });

const Resena = mongoose.model('Reseña', reviewSchema);
module.exports = Resena;