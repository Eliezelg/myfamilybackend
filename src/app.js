const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prismaMiddleware = require('./middlewares/prisma');
const path = require('path');
const multer = require('multer');

// Routes
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const userRoutes = require('./routes/userRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const photoRoutes = require('./routes/photoRoutes');

const app = express();
const prisma = new PrismaClient();

// Middleware de logging pour déboguer
app.use((req, res, next) => {
  console.log(' Requête reçue:', {
    method: req.method,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    headers: req.headers
  });
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(prismaMiddleware);
const upload = multer();
app.use(upload.any());

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test de la connexion à la base de données
prisma.$connect()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/photos', photoRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Une erreur est survenue',
    details: err.message
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  console.log('Route non trouvée:', req.originalUrl);
  res.status(404).json({
    status: 'error',
    message: 'Route non trouvée'
  });
});

module.exports = app;
