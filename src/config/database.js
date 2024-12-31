const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'family_profile_manager',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Synchroniser les modèles avec la base de données en forçant la recréation des tables
    await sequelize.sync({ force: true });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
