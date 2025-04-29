const express = require('express');
const { 
  crearUsuariosBulk, 
  obtenerUsuarios, 
  actualizarUsuariosBulk, 
  eliminarUsuariosBulk,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

router.post('/bulk', crearUsuariosBulk); // Crear múltiples usuarios
router.get('/', obtenerUsuarios); // Obtener usuarios con filtros, paginación, etc.
router.put('/bulk', actualizarUsuariosBulk); // Actualizar múltiples usuarios
router.delete('/bulk', eliminarUsuariosBulk); // Eliminar múltiples usuarios
router.post('/', createUser); // Crear un nuevo usuario
//router.get('/', getUsers); // Obtener todos los usuarios
router.get('/:id', getUserById); // Obtener un usuario por ID
router.put('/:id', updateUser); // Actualizar un usuario
router.delete('/:id', deleteUser); // Eliminar un usuario

module.exports = router;
