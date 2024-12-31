require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const requestLogger = require('./middlewares/logging');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const familyRoutes = require('./routes/familyRoutes');
const childRoutes = require('./routes/childRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const photoRoutes = require('./routes/photoRoutes');
const inviteController = require('./controllers/inviteController');
const { protect } = require('./middlewares/auth');
const path = require('path');

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(requestLogger);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Attacher l'instance Prisma à la requête
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/families', familyRoutes); 
app.use('/api/invites', inviteRoutes);
app.use('/api/families/:familyId/children', childRoutes);
app.use('/api/families/:familyId/invites', inviteRoutes);
app.use('/api/photos', photoRoutes);

// Route spécifique pour rejoindre une famille
app.post('/api/families/join', protect, inviteController.joinFamily);

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erreur détaillée:', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    details: err.message
  });
});

// Gestion de la fermeture propre de Prisma
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connection established successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
