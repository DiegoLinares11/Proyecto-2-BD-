const Promocion = require('../models/promotionModel');
const Menu = require('../models/menuModel');

// Crear promoción
const createPromocion = async (req, res) => {
  try {
    // Validar que los items existen
    const itemsValidos = await Menu.find({ _id: { $in: req.body.items_aplicables } });
    if (itemsValidos.length !== req.body.items_aplicables.length) {
      return res.status(400).json({ message: 'Uno o más ítems no existen' });
    }

    const nuevaPromocion = new Promocion(req.body);
    const promocionGuardada = await nuevaPromocion.save();
    res.status(201).json(promocionGuardada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Crear múltiples promociones
const crearPromocionesBulk = async (req, res) => {
  try {
    const result = await Promocion.insertMany(req.body, { ordered: false });
    res.status(201).json(result);
  } catch (error) {
    const errores = error.writeErrors?.map(err => ({
      campo: err.err.keyPattern,
      mensaje: err.err.errmsg
    }));
    res.status(500).json({ 
      error: 'Error creando algunas promociones',
      detalles: errores 
    });
  }
};

// Obtener promociones con filtros
const obtenerPromociones = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    tipo,
    activa,
    sortBy = 'fechaInicio',
    fields
  } = req.query;

  try {
    const filtros = {};
    if (tipo) filtros.tipo = tipo;
    if (activa === 'true') {
      filtros.fechaInicio = { $lte: new Date() };
      filtros.fechaFin = { $gte: new Date() };
    }

    const projection = fields ? fields.split(',').join(' ') : '-__v';
    const sort = { [sortBy]: sortBy === 'fechaInicio' ? -1 : 1 };

    const promociones = await Promocion.find(filtros)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('items_aplicables', 'nombre precio');

    const total = await Promocion.countDocuments(filtros);

    res.json({
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      promociones
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo promociones', message: error.message });
  }
};

// Actualizar múltiples promociones
const actualizarPromocionesBulk = async (req, res) => {
  const updates = req.body;
  try {
    const result = await Promise.all(
      updates.map(update => (
        Promocion.updateOne(
          { _id: update._id },
          { $set: { [update.campo]: update.nuevoValor } }
        )
      ))
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando promociones', message: error.message });
  }
};

// Eliminar múltiples promociones
const eliminarPromocionesBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Promocion.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando promociones', message: error.message });
  }
};

// Obtener todas las promociones
const getPromocionesCompletas = async (req, res) => {
  try {
    const promociones = await Promocion.find().populate('items_aplicables', 'nombre');
    res.json(promociones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener promoción por ID
const getPromocionById = async (req, res) => {
  try {
    const promocion = await Promocion.findById(req.params.id).populate('items_aplicables');
    if (!promocion) return res.status(404).json({ message: 'Promoción no encontrada' });
    res.json(promocion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar promoción
const updatePromocion = async (req, res) => {
  try {
    const updated = await Promocion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Promoción no encontrada' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar promoción
const deletePromocion = async (req, res) => {
  try {
    const deleted = await Promocion.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Promoción no encontrada' });
    res.json({ message: 'Promoción eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPromocion,
  crearPromocionesBulk,
  obtenerPromociones,
  actualizarPromocionesBulk,
  eliminarPromocionesBulk,
  getPromocionesCompletas,
  getPromocionById,
  updatePromocion,
  deletePromocion
};