const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
//const errorHandler = require('./utils/errorHandler');
const { connectDB } = require('./config/db');
const PORT = process.env.PORT || 5000;

const userRoutes = require('./routes/userRoutes');



// Cargar variables de entorno
dotenv.config();

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
//app.use('/api/restaurants', require('./routes/restaurantRoutes'));
//app.use('/api/menu-items', require('./routes/menuItemRoutes'));
//app.use('/api/orders', require('./routes/orderRoutes'));
//app.use('/api/reviews', require('./routes/reviewRoutes'));
//app.use('/api/files', require('./routes/fileRoutes'));

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
});


