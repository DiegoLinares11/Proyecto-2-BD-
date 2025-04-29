const User = require('../models/userModel');

// Crear usuario
const createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    // Manejar error de correo duplicado
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'El correo electrónico ya está registrado' 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Crear múltiples usuarios
const crearUsuariosBulk = async (req, res) => {
  try {
    const result = await User.insertMany(req.body, { ordered: false });
    res.status(201).json(result);
  } catch (error) {
    // Filtrar errores de duplicado
    const errores = error.writeErrors?.map(err => ({
      campo: err.err.keyPattern, // { email: 1 }
      mensaje: err.err.errmsg
    }));
    res.status(500).json({ 
      error: 'Error creando algunos usuarios',
      detalles: errores 
    });
  }
};


// Obtener usuarios con proyecciones y validación de índices
const obtenerUsuarios = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    nombre, 
    edad, 
    genero, 
    sortBy = 'fechaRegistro',
    fields 
  } = req.query;

  try {
    const filtros = {};
    if (nombre) filtros.nombre = { $regex: nombre, $options: 'i' };
    if (edad) filtros.edad = Number(edad);
    if (genero) filtros.genero = genero;

    const projection = fields ? fields.split(',').join(' ') : '-__v';
    const sort = { [sortBy]: sortBy === 'fechaRegistro' ? -1 : 1 };

    // Validar uso de índices
    if (nombre) {
      const explain = await User.find(filtros).explain('executionStats');
      console.log('Índice usado:', explain.executionStats.executionStages.inputStage.indexName);
    }

    const usuarios = await User.find(filtros)
      .select(projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filtros);

    res.json({ total, totalPages: Math.ceil(total / limit), page: Number(page), users: usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios', message: error.message });
  }
};


// Actualizar múltiples usuarios
const actualizarUsuariosBulk = async (req, res) => {
  const updates = req.body;
  try {
    const result = await Promise.all(
      updates.map((update) => {
        return User.updateOne(
          { _id: update._id },
          { $set: { [update.campo]: update.nuevoValor } }
        );
      })
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando usuarios', message: error.message });
  }
};

// Eliminar múltiples usuarios
const eliminarUsuariosBulk = async (req, res) => {
  const { ids } = req.body;
  try {
    const result = await User.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando usuarios', message: error.message });
  }
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser, 
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  crearUsuariosBulk,
  obtenerUsuarios,
  actualizarUsuariosBulk,
  eliminarUsuariosBulk,
};
