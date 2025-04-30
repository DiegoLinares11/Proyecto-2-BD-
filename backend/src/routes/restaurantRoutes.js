const express = require('express');
const router = express.Router();
const restauranteController = require('../controllers/restaurantController');

// CRUD básico
router.post('/', restauranteController.createRestaurante);
router.get('/', restauranteController.obtenerRestaurantes);
router.get('/all', restauranteController.getRestaurantes); // Endpoint adicional para obtener todos sin paginación
router.get('/:id', restauranteController.getRestauranteById);
router.put('/:id', restauranteController.updateRestaurante);
router.delete('/:id', restauranteController.deleteRestaurante);

// Bulk operations
router.post('/bulk', restauranteController.crearRestaurantesBulk);
router.put('/bulk/update', restauranteController.actualizarRestaurantesBulk);
router.delete('/bulk/delete', restauranteController.eliminarRestaurantesBulk);

module.exports = router;