const prisma = require('../lib/prisma');

exports.createFamily = async (req, res) => {
  console.log('Tentative de création de famille avec les données:', req.body);
  console.log('Utilisateur:', req.user);

  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Le nom de la famille est requis'
      });
    }

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non authentifié'
      });
    }

    console.log('Création de la famille avec name:', name, 'et userId:', userId);

    // Créer la famille et le membre admin en une seule transaction
    const family = await prisma.$transaction(async (tx) => {
      console.log('Début de la transaction');
      
      // Créer la famille
      const newFamily = await tx.family.create({
        data: {
          name,
          description: description || null,
          userId
        }
      });

      console.log('Famille créée:', newFamily);

      // Créer le membre admin
      const member = await tx.familyMember.create({
        data: {
          familyId: newFamily.id,
          userId: userId,
          role: 'admin',
          relationship: 'Créateur'
        }
      });

      console.log('Membre admin créé:', member);

      // Retourner la famille avec ses relations
      return tx.family.findUnique({
        where: { id: newFamily.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          children: true
        }
      });
    });

    console.log('Famille créée avec succès:', family);

    res.status(201).json({
      status: 'success',
      data: { family }
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la création de la famille:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de la famille',
      details: error.message
    });
  }
};

exports.getFamilies = async (req, res) => {
  console.log('Récupération des familles pour l\'utilisateur:', req.user.id);
  
  try {
    const userId = req.user.id;

    // Récupérer toutes les familles où l'utilisateur est membre
    const families = await prisma.family.findMany({
      where: {
        OR: [
          {
            userId: userId // Familles créées par l'utilisateur
          },
          {
            members: {
              some: {
                userId: userId // Familles où l'utilisateur est membre
              }
            }
          }
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        children: true
      }
    });

    console.log('Familles trouvées:', families);

    res.json({
      status: 'success',
      data: {
        families
      }
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des familles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des familles',
      details: error.message
    });
  }
};

exports.getFamily = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { familyId } = req.params;

    // Vérifier si l'utilisateur est membre de la famille
    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id
      }
    });

    if (!member) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas membre de cette famille'
      });
    }

    const family = await prisma.family.findUnique({
      where: {
        id: familyId
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        children: true,
        photos: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!family) {
      return res.status(404).json({
        status: 'error',
        message: 'Famille non trouvée'
      });
    }

    res.json({
      status: 'success',
      data: {
        family
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la famille:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de la famille',
      details: error.message
    });
  }
};

exports.updateFamily = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    const family = await prisma.family.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!family) {
      return res.status(404).json({
        status: 'error',
        message: 'Famille non trouvée'
      });
    }

    const updatedFamily = await prisma.family.update({
      where: { id },
      data: { name }
    });

    res.json({
      status: 'success',
      data: { family: updatedFamily }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la famille:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour de la famille'
    });
  }
};

exports.deleteFamily = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const family = await prisma.family.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!family) {
      return res.status(404).json({
        status: 'error',
        message: 'Famille non trouvée'
      });
    }

    await prisma.family.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Famille supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la famille:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression de la famille'
    });
  }
};
