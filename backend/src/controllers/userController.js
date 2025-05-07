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
  try {
    const updates = req.body; // Cada objeto debe tener al menos "email"
    const resultados = [];

    for (const update of updates) {
      const { email, ...resto } = update;
      const result = await User.updateOne({ email }, { $set: resto });

      // Usamos lean() para obtener el documento plano
      const updatedUser = await User.findOne({ email }).lean();

      // Almacenamos los resultados con el email y los nuevos valores
      resultados.push({
        email,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        updatedData: updatedUser // Ahora es un objeto plano
      });
    }

    res.json({ resultados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





// Eliminar múltiples usuarios
const eliminarUsuariosBulk = async (req, res) => {
  try {
    const usuarios = req.body;
    const emails = usuarios.map(u => u.email);
    const result = await User.deleteMany({ email: { $in: emails } });
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
