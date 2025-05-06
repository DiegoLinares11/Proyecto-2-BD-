const mongoose   = require('mongoose');
const User       = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Order      = require('../models/orderModel');
const Menu       = require('../models/menuModel');
const Promo      = require('../models/promotionModel');

// Agregaciones Simples (5)
exports.countUsers = async (req, res) => {
  try {
    const total = await User.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.distinctGenders = async (req, res) => {
  try {
    const genders = await User.distinct('genero');
    res.json({ genders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.countByCategory = async (req, res) => {
  try {
    const stats = await Restaurant.aggregate([
      { $unwind: '$categorias' },
      { $group: { _id: '$categorias', count: { $sum: 1 } } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.distinctMenuTags = async (req, res) => {
  try {
    const tags = await Menu.distinct('tags');
    res.json({ tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.countDeliveredOrders = async (req, res) => {
  try {
    const total = await Order.countDocuments({ estado: 'entregado' });
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Agregaciones Complejas (10)
exports.topRestaurants = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $unwind: '$items' },
      { $group: {
          _id: '$restaurante_id',
          revenue: { $sum: { $multiply: [ '$items.precio_unitario', '$items.cantidad' ] } }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: 'restaurantes', localField: '_id', foreignField: '_id', as: 'restaurant'
      }},
      { $unwind: '$restaurant' },
      { $project: { _id:0, restaurant: '$restaurant.nombre', revenue:1 } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.salesByWeekday = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $project: {
          weekday: { $dayOfWeek: '$fechaPedido' },
          total: { $sum: '$items.precio_unitario' }
      }},
      { $group: { _id: '$weekday', sales: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.avgRatingPerRestaurant = async (req, res) => {
  try {
    const stats = await Restaurant.aggregate([
      { $lookup: {
          from: 'reseñas', localField: '_id', foreignField: 'restaurante_id', as: 'reviews'
      }},
      { $unwind: '$reviews' },
      { $group: {
          _id: '$nombre',
          avgRating: { $avg: '$reviews.calificacion' }
      }},
      { $sort: { avgRating: -1 } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.avgOrderValue = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: null, avgValue: { $avg: '$total' } } }
    ]);
    res.json({ avgValue: stats[0]?.avgValue || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.mostPopularTags = async (req, res) => {
  try {
    const stats = await Menu.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.activePromotions = async (req, res) => {
  try {
    const now = new Date();
    const promos = await Promo.find({ fechaInicio: { $lte: now }, fechaFin: { $gte: now } });
    res.json({ promos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.avgDeliveryTime = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { fechaEntrega: { $exists: true } } },
      { $project: { diff: { $subtract: ['$fechaEntrega', '$fechaInicioPreparacion'] } } },
      { $group: { _id: null, avgTimeMs: { $avg: '$diff' } } }
    ]);
    res.json({ avgTimeMs: stats[0]?.avgTimeMs || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.ordersPerUser = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: '$usuario_id', count: { $sum: 1 } } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.totalSalesByCategory = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: {
          from: 'menu', localField: 'items._id', foreignField: '_id', as: 'menuItem'
      }},
      { $unwind: '$menuItem' },
      { $unwind: '$menuItem.tags' },
      { $group: { _id: '$menuItem.tags', totalSales: { $sum: { $multiply: ['$items.precio_unitario', '$items.cantidad'] } } } },
      { $sort: { totalSales: -1 } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.monthlyNewUsers = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $group: {
          _id: { month: { $month: '$fechaRegistro' }, year: { $year: '$fechaRegistro' } },
          count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manejo de Arrays (5)
exports.pushTagToMenu = async (req, res) => {
  try {
    const { menuId, tag } = req.body;
    const updated = await Menu.findByIdAndUpdate(menuId, { $push: { tags: tag } }, { new: true });
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pullTagFromMenu = async (req, res) => {
  try {
    const { menuId, tag } = req.body;
    const updated = await Menu.findByIdAndUpdate(menuId, { $pull: { tags: tag } }, { new: true });
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addUniqueItemToPromo = async (req, res) => {
  try {
    const { promoId, item } = req.body;
    const updated = await Promo.findByIdAndUpdate(promoId, { $addToSet: { items_aplicables: item } }, { new: true });
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.popFirstItemFromMenu = async (req, res) => {
  try {
    const { menuId } = req.body;
    const updated = await Menu.findByIdAndUpdate(menuId, { $pop: { tags: -1 } }, { new: true });
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pullAllTags = async (req, res) => {
  try {
    const { menuId, tags } = req.body;
    const updated = await Menu.findByIdAndUpdate(menuId, { $pullAll: { tags } }, { new: true });
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Documentos Embebidos (5)
exports.userWithOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(userId) } },
      { $lookup: { from: 'ordenes', localField: '_id', foreignField: 'usuario_id', as: 'orders' } }
    ]);
    res.json(user[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAddressToUser = async (req, res) => {
  try {
    const { userId, address } = req.body;
    const updated = await User.findByIdAndUpdate(userId, { $set: { domicilio: address } }, { new: true });
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.mergeProfileData = async (req, res) => {
  try {
    const { userId, profileUpdates } = req.body;
    const result = await User.updateOne(
      { _id: userId },
      [{ $set: { profile: { $mergeObjects: ['$profile', profileUpdates] } } }]
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserAddressAsRoot = async (req, res) => {
  try {
    const { userId } = req.query;
    const [address] = await User.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(userId) } },
      { $project: { _id:0, address: '$domicilio' } },
      { $replaceRoot: { newRoot: '$address' } }
    ]);
    res.json(address || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.projectEmbeddedOrders = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $project: { _id:0, usuario: '$usuario_id', items:1 } }
    ]);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
