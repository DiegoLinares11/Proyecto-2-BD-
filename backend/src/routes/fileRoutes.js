// routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const router = express.Router();

// Middleware de Multer en memoria con validaciones (10 MB y tipos permitidos)
// routes/fileRoutes.js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    console.log('Subiendo archivo:', file.originalname, '– tipo MIME:', file.mimetype);
    const allowed = [
      'image/png',
      'image/jpeg',
      'application/pdf',
      // añade aquí otros tipos si los necesitas
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// Crear índice en filename para búsquedas rápidas una vez abierta la conexión
mongoose.connection.once('open', () => {
  mongoose.connection.db
    .collection('uploads.files')
    .createIndex({ filename: 1 })
    .catch(err => console.error('Error creando índice uploads.files:', err));
});

// POST /api/files/upload — subir un archivo a GridFS
router.post(
  '/upload',
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const readStream = Readable.from(req.file.buffer);
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { size: req.file.size }
      });
      readStream.pipe(uploadStream)
        .on('error', err => res.status(500).json({ error: err.message }))
        .on('finish', file => {
          res.json({
            file: {
              id: file._id,
              filename: file.filename,
              contentType: file.contentType,
              uploadDate: file.uploadDate,
              length: file.length
            }
          });
        });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/files — listar archivos almacenados
router.get('/', async (req, res) => {
  try {
    const files = await mongoose.connection.db
      .collection('uploads.files')
      .find({}, { projection: { _id: 0, filename: 1, contentType: 1, uploadDate: 1 } })
      .toArray();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files/:filename — descargar archivo
router.get('/:filename', async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const file = await mongoose.connection.db
      .collection('uploads.files')
      .findOne({ filename: req.params.filename });
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.set('Content-Type', file.contentType);
    bucket.openDownloadStreamByName(req.params.filename).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:filename — eliminar archivo
router.delete('/:filename', async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const file = await mongoose.connection.db
      .collection('uploads.files')
      .findOne({ filename: req.params.filename });
    if (!file) return res.status(404).json({ error: 'File not found' });

    await bucket.delete(file._id);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
