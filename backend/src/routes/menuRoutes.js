const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// CRUD básico
router.post('/', menuController.createMenuItem);
router.get('/', menuController.obtenerMenu);
router.get('/all', menuController.getMenuCompleto);
router.get('/:id', menuController.getMenuItemById);
router.put('/:id', menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

// Bulk operations
router.post('/bulk', menuController.crearMenuBulk);
router.put('/bulk/update', menuController.actualizarMenuBulk);
router.delete('/bulk/delete', menuController.eliminarMenuBulk);

module.exports = router;
