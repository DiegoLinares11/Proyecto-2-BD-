const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  fechaRegistro: { type: Date, default: Date.now },
  edad: { type: Number, required: true },
  genero: { type: String, required: true },
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
