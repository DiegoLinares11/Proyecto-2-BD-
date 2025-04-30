const Resena = require('../models/reviewModel');
const Usuario = require('../models/userModel');
const Restaurante = require('../models/restaurantModel');

// Crear reseña
const createResena = async (req, res) => {
  try {
    // Validar que usuario y restaurante existen
    const [usuario, restaurante] = await Promise.all([
      Usuario.findById(req.body.usuario_id),
      Restaurante.findById(req.body.restaurante_id)
    ]);
    
    if (!usuario || !restaurante) {
      return res.status(404).json({ message: 'Usuario o restaurante no encontrado' });
    }

    const nuevaResena = new Resena(req.body);
    const resenaGuardada = await nuevaResena.save();
    res.status(201).json(resenaGuardada);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya has reseñado este restaurante' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Crear múltiples reseñas
const crearResenasBulk = async (req, res) => {
  try {
    const result = await Resena.insertMany(req.body, { ordered: false });
    res.status(201).json(result);
  } catch (error) {
    const errores = error.writeErrors?.map(err => ({
      campo: err.err.keyPattern,
      mensaje: err.err.errmsg
    }));
    res.status(500).json({ 
      error: 'Error creando algunas reseñas',
      detalles: errores 
    });
  }
};

// Obtener reseñas con filtros
const obtenerResenas = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    usuario_id,
    restaurante_id,
    minCalificacion,
    maxCalificacion,
    sortBy = 'fecha',
    fields
  } = req.query;

  try {
    const filtros = {};
    if (usuario_id) filtros.usuario_id = usuario_id;
    if (restaurante_id) filtros.restaurante_id = restaurante_id;
    
    if (minCalificacion || maxCalificacion) {
      filtros.calificacion = {};
      if (minCalificacion) filtros.calificacion.$gte = Number(minCalificacion);
      if (maxCalificacion) filtros.calificacion.$lte = Number(maxCalificacion);
    }

    const projection = fields ? fields.split(',').join(' ') : '-__v';
    const sort = { [sortBy]: sortBy === 'fecha' ? -1 : 1 };

    const resenas = await Resena.find(filtros)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('usuario_id', 'nombre')
      .populate('restaurante_id', 'nombre');

    const total = await Resena.countDocuments(filtros);

    res.json({
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      resenas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reseñas', message: error.message });
  }
};

// Actualizar múltiples reseñas
const actualizarResenasBulk = async (req, res) => {
  const updates = req.body;
  try {
    const result = await Promise.all(
      updates.map(update => (
        Resena.updateOne(
          { _id: update._id },
          { $set: { [update.campo]: update.nuevoValor } }
        )
      ))
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando reseñas', message: error.message });
  }
};

// Eliminar múltiples reseñas
const eliminarResenasBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Resena.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando reseñas', message: error.message });
  }
};

// Obtener todas las reseñas (sin paginación)
const getTodasResenas = async (req, res) => {
  try {
    const resenas = await Resena.find()
      .populate('usuario_id', 'nombre')
      .populate('restaurante_id', 'nombre');
    res.json(resenas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener reseña por ID
const getResenaById = async (req, res) => {
  try {
    const resena = await Resena.findById(req.params.id)
      .populate('usuario_id')
      .populate('restaurante_id');
      
    if (!resena) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.json(resena);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar reseña
const updateResena = async (req, res) => {
  try {
    const updated = await Resena.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar reseña
const deleteResena = async (req, res) => {
  try {
    const deleted = await Resena.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.json({ message: 'Reseña eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createResena,
  crearResenasBulk,
  obtenerResenas,
  actualizarResenasBulk,
  eliminarResenasBulk,
  getTodasResenas,
  getResenaById,
  updateResena,
  deleteResena
};