const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  estado: {
    type: String,
    required: true,
    enum: ['pendiente', 'en preparación', 'entregado'],
    index: true
  },
  fechaPedido: {
    type: Date,
    default: Date.now,
    index: -1
  },
  fechaInicioPreparacion: Date,
  fechaEntrega: Date,
  items: [{
    nombre: String,
    cantidad: Number,
    precio_unitario: Number
  }],
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

// Índice compuesto para consultas frecuentes
orderSchema.index({ usuario_id: 1, estado: 1 });
orderSchema.index({ restaurante_id: 1, fechaPedido: -1 });

const Orden = mongoose.model('Ordenes', orderSchema);
module.exports = Orden;