const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// CRUD básico
router.post('/', orderController.createOrden);
router.get('/', orderController.obtenerOrdenes);
router.get('/all', orderController.getTodasOrdenes);
router.get('/:id', orderController.getOrdenById);
router.put('/:id', orderController.updateOrden);
router.delete('/:id', orderController.deleteOrden);

// Bulk operations
router.post('/bulk', orderController.crearOrdenesBulk);
router.put('/bulk/update', orderController.actualizarOrdenesBulk);
router.delete('/bulk/delete', orderController.eliminarOrdenesBulk);

module.exports = router;