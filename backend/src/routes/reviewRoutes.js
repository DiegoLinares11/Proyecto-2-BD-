const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// CRUD básico
router.post('/', reviewController.createResena);
router.get('/', reviewController.obtenerResenas);
router.get('/all', reviewController.getTodasResenas);
router.get('/:id', reviewController.getResenaById);
router.put('/:id', reviewController.updateResena);
router.delete('/:id', reviewController.deleteResena);

// Bulk operations
router.post('/bulk', reviewController.crearResenasBulk);
router.put('/bulk/update', reviewController.actualizarResenasBulk);
router.delete('/bulk/delete', reviewController.eliminarResenasBulk);

module.exports = router;