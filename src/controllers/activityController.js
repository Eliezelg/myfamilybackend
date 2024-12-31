const Activity = require('../models/Activity');
const { Op } = require('sequelize');

// Récupérer les activités récentes
exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      status: 'success',
      activities
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des activités'
    });
  }
};

// Créer une nouvelle activité
exports.createActivity = async (userId, type, description, metadata = {}) => {
  try {
    await Activity.create({
      userId,
      type,
      description,
      metadata
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
  }
};
