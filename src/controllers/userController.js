const prisma = require('../lib/prisma');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        location: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération du profil',
      details: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      birthDate,
      gender,
      location,
      bio
    } = req.body;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender: gender || undefined,
        location: location || undefined,
        bio: bio || undefined
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        location: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour du profil',
      details: error.message
    });
  }
};
