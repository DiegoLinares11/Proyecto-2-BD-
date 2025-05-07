const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
//const errorHandler = require('./utils/errorHandler');
const { connectDB } = require('./config/db');
const PORT = process.env.PORT || 5000;

const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Inicializar app
const app = express();

// Conectar a la base de datos
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Configurar MongoDB para rechazar consultas sin índices
mongoose.set('strictQuery', true);

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/aggregations', require('./routes/aggregationRoutes'));


// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API del Sistema de Gestión de Pedidos y Reseñas de Restaurantes funcionando' });
});

// Middleware para manejar rutas inexistentes
app.use((req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware de manejo de errores global
//app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} en modo ${process.env.NODE_ENV}`);
  require('./menu'); //esto ya sirve para el menu.
});


