const express = require('express');
const router = express.Router();
const agg = require('../controllers/aggregationController');

// Agregaciones Simples (5)
router.get('/simples/countUsers',          agg.countUsers);
router.get('/simples/distinctGenders',     agg.distinctGenders);
router.get('/simples/countByCategory',     agg.countByCategory);
router.get('/simples/distinctMenuTags',    agg.distinctMenuTags);
router.get('/simples/countDeliveredOrders',agg.countDeliveredOrders);

// Agregaciones Complejas (10)
router.get('/complejas/topRestaurants',        agg.topRestaurants);
router.get('/complejas/salesByWeekday',        agg.salesByWeekday);
router.get('/complejas/avgRatingPerRestaurant',agg.avgRatingPerRestaurant);
router.get('/complejas/avgOrderValue',         agg.avgOrderValue);
router.get('/complejas/mostPopularTags',       agg.mostPopularTags);
router.get('/complejas/activePromotions',      agg.activePromotions);
router.get('/complejas/avgDeliveryTime',       agg.avgDeliveryTime);
router.get('/complejas/ordersPerUser',         agg.ordersPerUser);
router.get('/complejas/totalSalesByCategory',  agg.totalSalesByCategory);
router.get('/complejas/monthlyNewUsers',       agg.monthlyNewUsers);

// Manejo de Arrays (5)
router.post('/arrays/pushTag',     agg.pushTagToMenu);
router.post('/arrays/pullTag',     agg.pullTagFromMenu);
router.post('/arrays/addToSet',    agg.addUniqueItemToPromo);
router.post('/arrays/popFirst',    agg.popFirstItemFromMenu);
router.post('/arrays/pullAll',     agg.pullAllTags);

// Documentos Embebidos (5)
router.get('/embedded/userOrders',    agg.userWithOrders);
router.post('/embedded/addAddress',   agg.addAddressToUser);
router.post('/embedded/mergeProfile', agg.mergeProfileData);
router.get('/embedded/getAddress',    agg.getUserAddressAsRoot);
router.get('/embedded/projectOrders', agg.projectEmbeddedOrders);

module.exports = router;
