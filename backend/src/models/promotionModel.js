const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    index: true
  },
  fechaInicio: {
    type: Date,
    required: true,
    index: -1
  },
  fechaFin: {
    type: Date,
    required: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['descuento', '2x1', 'combo'],
    index: true
  },
  items_aplicables: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  }],
  descuento: {
    type: Number,
    min: 0.1,
    max: 0.5,
    validate: {
      validator: function(v) {
        return this.tipo === 'descuento' ? v !== undefined : true;
      },
      message: 'El descuento es requerido para promociones de tipo "descuento"'
    }
  }
});

// Índice compuesto para búsquedas por tipo y fecha
promotionSchema.index({ tipo: 1, fechaInicio: -1 });

const Promocion = mongoose.model('Promociones', promotionSchema);
module.exports = Promocion;