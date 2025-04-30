const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// CRUD básico
router.post('/', paymentController.createPago);
router.get('/', paymentController.obtenerPagos);
router.get('/all', paymentController.getPagosCompletos);
router.get('/:id', paymentController.getPagoById);
router.put('/:id', paymentController.updatePago);
router.delete('/:id', paymentController.deletePago);

// Bulk operations
router.post('/bulk', paymentController.crearPagosBulk);
router.put('/bulk/update', paymentController.actualizarPagosBulk);
router.delete('/bulk/delete', paymentController.eliminarPagosBulk);

module.exports = router;
