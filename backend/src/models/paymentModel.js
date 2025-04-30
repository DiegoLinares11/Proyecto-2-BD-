const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orden_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  monto: {
    type: Number,
    required: true
  },
  metodoPago: {
    type: String,
    enum: ['tarjeta de crédito', 'efectivo', 'tarjeta de débito'],
    required: true
  },
  estado: {
    type: String,
    enum: ['completado', 'fallido', 'pendiente'],
    default: 'completado'
  },
  fecha: {
    type: Date,
    required: true
  }
});

const Payment = mongoose.model('Pago', paymentSchema);
module.exports = Payment;
