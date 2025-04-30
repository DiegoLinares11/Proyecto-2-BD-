const Restaurante = require('../models/restaurantModel');

// Crear restaurante
const createRestaurante = async (req, res) => {
  try {
    const newRestaurante = new Restaurante(req.body);
    const savedRestaurante = await newRestaurante.save();
    res.status(201).json(savedRestaurante);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Restaurante ya registrado' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Crear múltiples restaurantes
const crearRestaurantesBulk = async (req, res) => {
  try {
    const result = await Restaurante.insertMany(req.body, { ordered: false });
    res.status(201).json(result);
  } catch (error) {
    const errores = error.writeErrors?.map(err => ({
      campo: err.err.keyPattern,
      mensaje: err.err.errmsg
    }));
    res.status(500).json({ 
      error: 'Error creando algunos restaurantes',
      detalles: errores 
    });
  }
};

// Obtener restaurantes con filtros
const obtenerRestaurantes = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    nombre, 
    categoria, 
    sortBy = 'createdAt',
    fields 
  } = req.query;

  try {
    const filtros = {};
    if (nombre) filtros.nombre = { $regex: nombre, $options: 'i' };
    if (categoria) filtros.categorias = categoria;

    const projection = fields ? fields.split(',').join(' ') : '-__v';
    const sort = { [sortBy]: sortBy === 'createdAt' ? -1 : 1 };

    // Validar uso de índices
    if (nombre) {
      const explain = await Restaurante.find(filtros).explain('executionStats');
      console.log('Índice usado:', explain.executionStats.executionStages.inputStage.indexName);
    }

    const restaurantes = await Restaurante.find(filtros)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Restaurante.countDocuments(filtros);

    res.json({ 
      total, 
      totalPages: Math.ceil(total / limit), 
      page: Number(page), 
      restaurantes 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo restaurantes', message: error.message });
  }
};

// Actualizar múltiples restaurantes
const actualizarRestaurantesBulk = async (req, res) => {
  const updates = req.body;
  try {
    const result = await Promise.all(
      updates.map(update => (
        Restaurante.updateOne(
          { _id: update._id },
          { $set: { [update.campo]: update.nuevoValor } }
        )
      ))
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando restaurantes', message: error.message });
  }
};

// Eliminar múltiples restaurantes
const eliminarRestaurantesBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Restaurante.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando restaurantes', message: error.message });
  }
};

// Obtener todos los restaurantes
const getRestaurantes = async (req, res) => {
  try {
    const restaurantes = await Restaurante.find();
    res.json(restaurantes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener restaurante por ID
const getRestauranteById = async (req, res) => {
  try {
    const restaurante = await Restaurante.findById(req.params.id);
    if (!restaurante) return res.status(404).json({ message: 'Restaurante no encontrado' });
    res.json(restaurante);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar restaurante
const updateRestaurante = async (req, res) => {
  try {
    const updatedRestaurante = await Restaurante.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedRestaurante) return res.status(404).json({ message: 'Restaurante no encontrado' });
    res.json(updatedRestaurante);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar restaurante
const deleteRestaurante = async (req, res) => {
  try {
    const deletedRestaurante = await Restaurante.findByIdAndDelete(req.params.id);
    if (!deletedRestaurante) return res.status(404).json({ message: 'Restaurante no encontrado' });
    res.json({ message: 'Restaurante eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRestaurante,
  crearRestaurantesBulk,
  obtenerRestaurantes,
  actualizarRestaurantesBulk,
  eliminarRestaurantesBulk,
  getRestaurantes,
  getRestauranteById,
  updateRestaurante,
  deleteRestaurante
};