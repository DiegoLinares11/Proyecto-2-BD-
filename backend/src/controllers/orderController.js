const Orden = require('../models/orderModel');
const Usuario = require('../models/userModel');
const Restaurante = require('../models/restaurantModel');

// Crear orden
const createOrden = async (req, res) => {
  try {
    // Validar referencias
    const [usuario, restaurante] = await Promise.all([
      Usuario.findById(req.body.usuario_id),
      Restaurante.findById(req.body.restaurante_id)
    ]);

    if (!usuario || !restaurante) {
      return res.status(404).json({ message: 'Usuario o restaurante no encontrado' });
    }

    const newOrden = new Orden(req.body);
    const savedOrden = await newOrden.save();
    res.status(201).json(savedOrden);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Crear múltiples órdenes
const crearOrdenesBulk = async (req, res) => {
  try {
    const result = await Orden.insertMany(req.body, { ordered: false });
    res.status(201).json(result);
  } catch (error) {
    const errores = error.writeErrors?.map(err => ({
      campo: err.err.keyPattern,
      mensaje: err.err.errmsg
    }));
    res.status(500).json({ 
      error: 'Error creando algunas órdenes',
      detalles: errores 
    });
  }
};

// Obtener órdenes con filtros
const obtenerOrdenes = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    usuario_id,
    restaurante_id,
    estado,
    desde,
    hasta,
    sortBy = 'fechaPedido',
    fields
  } = req.query;

  try {
    const filtros = {};
    if (usuario_id) filtros.usuario_id = usuario_id;
    if (restaurante_id) filtros.restaurante_id = restaurante_id;
    if (estado) filtros.estado = estado;
    
    if (desde || hasta) {
      filtros.fechaPedido = {};
      if (desde) filtros.fechaPedido.$gte = new Date(desde);
      if (hasta) filtros.fechaPedido.$lte = new Date(hasta);
    }

    const projection = fields ? fields.split(',').join(' ') : '-__v';
    const sort = { [sortBy]: sortBy === 'fechaPedido' ? -1 : 1 };

    const ordenes = await Orden.find(filtros)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('usuario_id', 'nombre email')
      .populate('restaurante_id', 'nombre direccion');

    const total = await Orden.countDocuments(filtros);

    res.json({
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      ordenes
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo órdenes', message: error.message });
  }
};

// Actualizar múltiples órdenes
const actualizarOrdenesBulk = async (req, res) => {
  const updates = req.body;
  try {
    const result = await Promise.all(
      updates.map(update => (
        Orden.updateOne(
          { _id: update._id },
          { $set: { [update.campo]: update.nuevoValor } }
        )
      ))
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando órdenes', message: error.message });
  }
};

// Eliminar múltiples órdenes
const eliminarOrdenesBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Orden.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando órdenes', message: error.message });
  }
};

// Obtener todas las órdenes (sin paginación)
const getTodasOrdenes = async (req, res) => {
  try {
    const ordenes = await Orden.find()
      .populate('usuario_id', 'nombre')
      .populate('restaurante_id', 'nombre');
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener orden por ID
const getOrdenById = async (req, res) => {
  try {
    const orden = await Orden.findById(req.params.id)
      .populate('usuario_id')
      .populate('restaurante_id');
      
    if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(orden);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar orden
const updateOrden = async (req, res) => {
  try {
    const updated = await Orden.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar orden
const deleteOrden = async (req, res) => {
  try {
    const deleted = await Orden.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json({ message: 'Orden eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrden,
  crearOrdenesBulk,
  obtenerOrdenes,
  actualizarOrdenesBulk,
  eliminarOrdenesBulk,
  getTodasOrdenes,
  getOrdenById,
  updateOrden,
  deleteOrden
};