require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const Child = require('../models/Child');

async function initializeDatabase() {
  try {
    // Synchroniser les modèles avec la base de données
    await sequelize.sync({ force: true });
    console.log('Base de données synchronisée avec succès');

    // Créer un utilisateur de test si en développement
    if (process.env.NODE_ENV === 'development') {
      await User.create({
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'John',
        lastName: 'Doe'
      });
      console.log('Utilisateur de test créé');
    }

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

initializeDatabase();
