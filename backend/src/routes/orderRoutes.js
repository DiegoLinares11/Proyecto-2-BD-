const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/auth');

// Rutas para usuarios (protegidas)
router.get('/my-orders', protect, orderController.getMyOrders);
router.post('/', protect, orderController.createOrder);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/cancel', protect, orderController.cancelOrder);

// Rutas para restaurantes (protegidas, requeriría middleware adicional para verificar permisos)
router.get('/restaurant/:restaurantId', protect, orderController.getRestaurantOrders);
router.put('/:id/status', protect, orderController.updateOrderStatus);
router.put('/:id/items', protect, orderController.updateOrderItems);

module.exports = router;