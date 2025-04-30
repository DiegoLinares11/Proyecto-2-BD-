const Payment = require('../models/paymentModel');

// Crear un pago
const createPago = async (req, res) => {
  try {
    const newPago = new Payment(req.body);
    const saved = await newPago.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Crear múltiples pagos
const crearPagosBulk = async (req, res) => {
  try {
    const result = await Payment.insertMany(req.body, { ordered: false });
    res.status(201).json(result);
  } catch (error) {
    const errores = error.writeErrors?.map(err => ({
      campo: err.err.keyPattern,
      mensaje: err.err.errmsg
    }));
    res.status(500).json({ 
      error: 'Error creando algunos pagos',
      detalles: errores 
    });
  }
};

// Obtener pagos con filtros, paginación, proyección y ordenamiento
const obtenerPagos = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    usuario_id,
    orden_id,
    metodoPago,
    estado,
    sortBy = 'fecha',
    fields
  } = req.query;

  try {
    const filtros = {};
    if (usuario_id) filtros.usuario_id = usuario_id;
    if (orden_id) filtros.orden_id = orden_id;
    if (metodoPago) filtros.metodoPago = metodoPago;
    if (estado) filtros.estado = estado;

    const projection = fields ? fields.split(',').join(' ') : '-__v';
    const sort = { [sortBy]: sortBy === 'fecha' ? -1 : 1 };

    const pagos = await Payment.find(filtros)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filtros);

    res.json({
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      pagos
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pagos', message: error.message });
  }
};

// Obtener todos los pagos
const getPagosCompletos = async (req, res) => {
  try {
    const pagos = await Payment.find();
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener pago por ID
const getPagoById = async (req, res) => {
  try {
    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ message: 'Pago no encontrado' });
    res.json(pago);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar pago
const updatePago = async (req, res) => {
  try {
    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Pago no encontrado' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar pago
const deletePago = async (req, res) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Pago no encontrado' });
    res.json({ message: 'Pago eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar múltiples pagos
const actualizarPagosBulk = async (req, res) => {
  const updates = req.body;
  try {
    const result = await Promise.all(
      updates.map(update => (
        Payment.updateOne(
          { _id: update._id },
          { $set: { [update.campo]: update.nuevoValor } }
        )
      ))
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando pagos', message: error.message });
  }
};

// Eliminar múltiples pagos
const eliminarPagosBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Payment.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando pagos', message: error.message });
  }
};

module.exports = {
  createPago,
  crearPagosBulk,
  obtenerPagos,
  getPagosCompletos,
  getPagoById,
  updatePago,
  deletePago,
  actualizarPagosBulk,
  eliminarPagosBulk
};
