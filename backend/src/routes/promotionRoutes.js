const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');

// CRUD básico
router.post('/', promotionController.createPromocion);
router.get('/', promotionController.obtenerPromociones);
router.get('/all', promotionController.getPromocionesCompletas);
router.get('/:id', promotionController.getPromocionById);
router.put('/:id', promotionController.updatePromocion);
router.delete('/:id', promotionController.deletePromocion);

// Bulk operations
router.post('/bulk', promotionController.crearPromocionesBulk);
router.put('/bulk/update', promotionController.actualizarPromocionesBulk);
router.delete('/bulk/delete', promotionController.eliminarPromocionesBulk);

module.exports = router;