const prisma = require('../lib/prisma');

// Ajouter un enfant à une famille
exports.addChild = async (req, res) => {
  try {
    const { familyId } = req.params;
    const { firstName, lastName, birthDate, gender, birthPlace } = req.body;

    // Vérifier si l'utilisateur a accès à cette famille
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id,
        role: 'admin'
      }
    });

    if (!familyMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour ajouter un enfant à cette famille'
      });
    }

    // Créer l'enfant
    const child = await prisma.child.create({
      data: {
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        gender,
        birthPlace,
        familyId
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        child
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un enfant:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'ajout d\'un enfant',
      details: error.message
    });
  }
};

// Obtenir la liste des enfants d'une famille
exports.getChildren = async (req, res) => {
  try {
    const { familyId } = req.params;

    // Vérifier si l'utilisateur a accès à cette famille
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id
      }
    });

    if (!familyMember) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas accès à cette famille'
      });
    }

    // Récupérer les enfants
    const children = await prisma.child.findMany({
      where: {
        familyId
      }
    });

    res.json({
      status: 'success',
      data: {
        children
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des enfants:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des enfants',
      details: error.message
    });
  }
};
