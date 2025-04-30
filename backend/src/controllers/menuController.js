const Menu = require('../models/menuModel');

// Crear ítem de menú
const createMenuItem = async (req, res) => {
  try {
    const newItem = new Menu(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ítem duplicado en el menú del restaurante' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Crear múltiples ítems de menú
const crearMenuBulk = async (req, res) => {
  try {
    const result = await Menu.insertMany(req.body, { ordered: false });
    res.status(201).json(result);
  } catch (error) {
    const errores = error.writeErrors?.map(err => ({
      campo: err.err.keyPattern,
      mensaje: err.err.errmsg
    }));
    res.status(500).json({ 
      error: 'Error creando algunos ítems de menú',
      detalles: errores 
    });
  }
};

// Obtener ítems de menú con filtros
const obtenerMenu = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    nombre,
    disponible,
    tag,
    sortBy = 'createdAt',
    fields
  } = req.query;

  try {
    const filtros = {};
    if (nombre) filtros.nombre = { $regex: nombre, $options: 'i' };
    if (disponible !== undefined) filtros.disponible = disponible === 'true';
    if (tag) filtros.tags = tag;

    const projection = fields ? fields.split(',').join(' ') : '-__v';
    const sort = { [sortBy]: sortBy === 'createdAt' ? -1 : 1 };

    const menu = await Menu.find(filtros)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Menu.countDocuments(filtros);

    res.json({
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      menu
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo el menú', message: error.message });
  }
};

// Actualizar múltiples ítems de menú
const actualizarMenuBulk = async (req, res) => {
  const updates = req.body;
  try {
    const result = await Promise.all(
      updates.map(update => (
        Menu.updateOne(
          { _id: update._id },
          { $set: { [update.campo]: update.nuevoValor } }
        )
      ))
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando ítems de menú', message: error.message });
  }
};

// Eliminar múltiples ítems de menú
const eliminarMenuBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await Menu.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando ítems de menú', message: error.message });
  }
};

// Obtener todos los ítems sin paginación
const getMenuCompleto = async (req, res) => {
  try {
    const menu = await Menu.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener ítem por ID
const getMenuItemById = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Ítem no encontrado' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar ítem
const updateMenuItem = async (req, res) => {
  try {
    const updated = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Ítem no encontrado' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar ítem
const deleteMenuItem = async (req, res) => {
  try {
    const deleted = await Menu.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Ítem no encontrado' });
    res.json({ message: 'Ítem eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMenuItem,
  crearMenuBulk,
  obtenerMenu,
  actualizarMenuBulk,
  eliminarMenuBulk,
  getMenuCompleto,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem
};
