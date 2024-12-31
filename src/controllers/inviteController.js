const crypto = require('crypto');

// Générer un token unique
const generateUniqueToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Générer un code d'invitation de 6 caractères
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Vérifier si l'utilisateur est admin de la famille
const isUserFamilyAdmin = async (userId, familyId, prisma) => {
  const member = await prisma.familyMember.findFirst({
    where: {
      userId: userId,
      familyId: familyId,
      role: 'admin'
    }
  });
  return !!member;
};

// Générer un lien d'invitation
exports.generateInviteLink = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { familyId } = req.body;
    const userId = req.user.id;

    console.log('Génération de lien d\'invitation pour la famille:', familyId);
    console.log('Utilisateur:', userId);

    // Vérifier si l'utilisateur est admin
    const isAdmin = await isUserFamilyAdmin(userId, familyId, prisma);
    if (!isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Seuls les administrateurs peuvent générer des invitations'
      });
    }

    // Générer un nouveau token
    const token = generateUniqueToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    // Créer l'invitation
    const invite = await prisma.familyInvite.create({
      data: {
        familyId,
        token,
        createdById: userId,
        expiresAt
      }
    });

    console.log('Invitation créée:', invite);

    // Construire le lien d'invitation
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/join?token=${token}`;

    res.json({
      status: 'success',
      data: {
        inviteLink,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du lien d\'invitation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la génération du lien d\'invitation',
      details: error.message
    });
  }
};

// Générer un code d'invitation
exports.generateInviteCode = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { familyId } = req.body;
    const userId = req.user.id;

    console.log('Génération de code d\'invitation pour la famille:', familyId);
    console.log('Utilisateur:', userId);

    // Vérifier si l'utilisateur est admin
    const isAdmin = await isUserFamilyAdmin(userId, familyId, prisma);
    if (!isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Seuls les administrateurs peuvent générer des invitations'
      });
    }

    // Générer un nouveau code
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    // Créer l'invitation
    const invite = await prisma.familyInvite.create({
      data: {
        familyId,
        code,
        createdById: userId,
        expiresAt
      }
    });

    console.log('Invitation créée:', invite);

    res.json({
      status: 'success',
      data: {
        inviteCode: code,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du code d\'invitation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la génération du code d\'invitation',
      details: error.message
    });
  }
};

// Rejoindre une famille avec un token
exports.joinFamilyWithToken = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { token } = req.body;
    const userId = req.user.id;

    console.log('Tentative de rejoindre avec le token:', token);
    console.log('Utilisateur:', userId);

    // Trouver l'invitation
    const invite = await prisma.familyInvite.findUnique({
      where: { token },
      include: { family: true }
    });

    if (!invite) {
      return res.status(404).json({
        status: 'error',
        message: 'Invitation non trouvée ou expirée'
      });
    }

    // Vérifier si l'invitation n'est pas expirée
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a expiré'
      });
    }

    // Vérifier si l'utilisateur n'est pas déjà membre
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        familyId: invite.familyId,
        userId
      }
    });

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous êtes déjà membre de cette famille'
      });
    }

    // Ajouter l'utilisateur comme membre
    const member = await prisma.familyMember.create({
      data: {
        familyId: invite.familyId,
        userId,
        role: 'member'
      },
      include: {
        family: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('Nouveau membre ajouté:', member);

    res.json({
      status: 'success',
      data: { member }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'ajout à la famille',
      details: error.message
    });
  }
};

// Rejoindre une famille avec un code
exports.joinFamilyWithCode = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { code } = req.body;
    const userId = req.user.id;

    console.log('Tentative de rejoindre avec le code:', code);
    console.log('Utilisateur:', userId);

    // Trouver l'invitation
    const invite = await prisma.familyInvite.findUnique({
      where: { code },
      include: { family: true }
    });

    if (!invite) {
      return res.status(404).json({
        status: 'error',
        message: 'Code d\'invitation non trouvé ou expiré'
      });
    }

    // Vérifier si l'invitation n'est pas expirée
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce code d\'invitation a expiré'
      });
    }

    // Vérifier si l'utilisateur n'est pas déjà membre
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        familyId: invite.familyId,
        userId
      }
    });

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous êtes déjà membre de cette famille'
      });
    }

    // Ajouter l'utilisateur comme membre
    const member = await prisma.familyMember.create({
      data: {
        familyId: invite.familyId,
        userId,
        role: 'member'
      },
      include: {
        family: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('Nouveau membre ajouté:', member);

    res.json({
      status: 'success',
      data: { member }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du membre:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'ajout à la famille',
      details: error.message
    });
  }
};

// Créer le contrôleur des invitations
exports.createInvite = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { familyId } = req.body;
    const { email, relationship } = req.body;

    // Vérifier si l'utilisateur est admin de la famille
    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id,
        role: 'admin'
      }
    });

    if (!member) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour inviter des membres dans cette famille'
      });
    }

    // Générer un code d'invitation unique
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Créer l'invitation
    const invite = await prisma.familyInvite.create({
      data: {
        code: inviteCode,
        email,
        relationship,
        familyId,
        createdById: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire dans 7 jours
      },
      include: {
        family: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        invite: {
          ...invite,
          inviteLink: `http://localhost:5000/join-family?code=${inviteCode}`
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'invitation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de l\'invitation',
      details: error.message
    });
  }
};

// Générer un lien d'invitation
exports.generateInviteLink = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { familyId } = req.body;

    // Vérifier si l'utilisateur est admin de la famille
    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id,
        role: 'admin'
      }
    });

    if (!member) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour générer des invitations pour cette famille'
      });
    }

    // Générer un code d'invitation unique
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Créer l'invitation sans email (invitation générique)
    const invite = await prisma.familyInvite.create({
      data: {
        code: inviteCode,
        email: 'invitation_link@temp.com', // Email temporaire requis par le schéma
        familyId,
        createdById: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire dans 7 jours
      },
      include: {
        family: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        inviteLink: `http://localhost:5000/join-family?code=${inviteCode}`
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du lien d\'invitation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la génération du lien d\'invitation',
      details: error.message
    });
  }
};

// Générer un code d'invitation
exports.generateInviteCode = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { familyId } = req.body;

    // Vérifier si l'utilisateur est admin de la famille
    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id,
        role: 'admin'
      }
    });

    if (!member) {
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'avez pas les droits pour générer des invitations pour cette famille'
      });
    }

    // Générer un code d'invitation unique
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Créer l'invitation sans email (invitation générique)
    const invite = await prisma.familyInvite.create({
      data: {
        code: inviteCode,
        email: 'invitation_code@temp.com', // Email temporaire requis par le schéma
        familyId,
        createdById: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire dans 7 jours
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        inviteCode
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du code d\'invitation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la génération du code d\'invitation',
      details: error.message
    });
  }
};

// Vérifier une invitation
exports.checkInvite = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { code } = req.params;

    const invite = await prisma.familyInvite.findUnique({
      where: { code },
      include: {
        family: {
          select: {
            name: true,
            description: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!invite) {
      return res.status(404).json({
        status: 'error',
        message: 'Code d\'invitation invalide'
      });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a expiré'
      });
    }

    if (invite.accepted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a déjà été utilisée'
      });
    }

    res.json({
      status: 'success',
      data: {
        invite: {
          code: invite.code,
          relationship: invite.relationship,
          family: invite.family,
          invitedBy: invite.createdBy,
          expiresAt: invite.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'invitation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification de l\'invitation',
      details: error.message
    });
  }
};

// Accepter une invitation
exports.acceptInvite = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { code } = req.params;
    const { profile, relationship } = req.body; // Ajout du champ relationship

    // Trouver l'invitation
    const invite = await prisma.familyInvite.findUnique({
      where: { code },
      include: {
        family: true
      }
    });

    if (!invite) {
      return res.status(404).json({
        status: 'error',
        message: 'Code d\'invitation invalide'
      });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a expiré'
      });
    }

    if (invite.accepted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a déjà été utilisée'
      });
    }

    // Vérifier si l'utilisateur est déjà membre de la famille
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        familyId: invite.familyId,
        userId: req.user.id
      }
    });

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous êtes déjà membre de cette famille'
      });
    }

    // Mettre à jour le profil de l'utilisateur si des données sont fournies
    if (profile) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          birthDate: profile.birthDate || undefined,
          gender: profile.gender || undefined,
          location: profile.location || undefined,
          bio: profile.bio || undefined
        }
      });
    }

    // Déterminer la relation
    // Si c'est une invitation générique (avec email temporaire), utiliser la relation fournie
    // Sinon, utiliser la relation de l'invitation
    const memberRelationship = invite.email.includes('@temp.com') ? relationship : invite.relationship;

    if (!memberRelationship) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez spécifier votre relation avec la famille'
      });
    }

    // Créer le membre de la famille
    const member = await prisma.familyMember.create({
      data: {
        familyId: invite.familyId,
        userId: req.user.id,
        role: 'member',
        relationship: memberRelationship
      }
    });

    // Marquer l'invitation comme acceptée
    await prisma.familyInvite.update({
      where: { id: invite.id },
      data: { 
        accepted: true,
        email: req.user.email // Mettre à jour l'email avec l'email de l'utilisateur qui accepte
      }
    });

    // Récupérer les informations mises à jour de l'utilisateur
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
        gender: true,
        location: true,
        bio: true
      }
    });

    res.json({
      status: 'success',
      data: {
        member,
        family: invite.family,
        profile: updatedUser
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'acceptation de l\'invitation',
      details: error.message
    });
  }
};

// Récupérer les détails d'une famille par code d'invitation
exports.getFamilyByInviteCode = async (req, res) => {
  const prisma = req.prisma;
  try {
    const { code } = req.params;

    const invite = await prisma.familyInvite.findUnique({
      where: { code },
      include: {
        family: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!invite) {
      return res.status(404).json({
        status: 'error',
        message: 'Code d\'invitation invalide'
      });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a expiré'
      });
    }

    if (invite.accepted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a déjà été utilisée'
      });
    }

    res.json({
      status: 'success',
      data: {
        family: {
          ...invite.family,
          invitedBy: invite.createdBy
        }
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

// Rejoindre une famille avec un code d'invitation
exports.joinFamily = async (req, res) => {
  const prisma = req.prisma;
  try {
    console.log('Tentative de rejoindre une famille');
    console.log('Corps de la requête:', req.body);
    console.log('Utilisateur:', req.user);

    const { inviteCode: code, relationship, profile } = req.body;

    // Trouver l'invitation
    console.log('Recherche de l\'invitation avec le code:', code);
    const invite = await prisma.familyInvite.findUnique({
      where: { code },
      include: {
        family: true
      }
    });
    console.log('Invitation trouvée:', invite);

    if (!invite) {
      return res.status(404).json({
        status: 'error',
        message: 'Code d\'invitation invalide'
      });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a expiré'
      });
    }

    if (invite.accepted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cette invitation a déjà été utilisée'
      });
    }

    // Vérifier si l'utilisateur est déjà membre de la famille
    console.log('Vérification si l\'utilisateur est déjà membre');
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        familyId: invite.familyId,
        userId: req.user.id
      }
    });
    console.log('Membre existant:', existingMember);

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'Vous êtes déjà membre de cette famille'
      });
    }

    // Mettre à jour le profil de l'utilisateur si des données sont fournies
    if (profile) {
      console.log('Mise à jour du profil avec:', profile);
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          birthDate: profile.birthDate || undefined,
          gender: profile.gender || undefined,
          location: profile.location || undefined,
          bio: profile.bio || undefined
        }
      });
    }

    // Déterminer la relation
    const memberRelationship = invite.email.includes('@temp.com') ? relationship : invite.relationship;
    console.log('Relation déterminée:', memberRelationship);

    if (!memberRelationship) {
      return res.status(400).json({
        status: 'error',
        message: 'Veuillez spécifier votre relation avec la famille'
      });
    }

    // Créer le membre de la famille
    console.log('Création du membre de la famille');
    const member = await prisma.familyMember.create({
      data: {
        familyId: invite.familyId,
        userId: req.user.id,
        role: 'member',
        relationship: memberRelationship
      }
    });
    console.log('Membre créé:', member);

    // Marquer l'invitation comme acceptée
    console.log('Mise à jour de l\'invitation');
    await prisma.familyInvite.update({
      where: { id: invite.id },
      data: {
        accepted: true,
        email: req.user.email // Mettre à jour l'email avec l'email de l'utilisateur qui accepte
      }
    });

    // Récupérer les informations mises à jour de l'utilisateur
    console.log('Récupération des informations de l\'utilisateur');
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
        gender: true,
        location: true,
        bio: true
      }
    });
    console.log('Utilisateur mis à jour:', updatedUser);

    res.json({
      status: 'success',
      data: {
        member,
        family: invite.family,
        profile: updatedUser
      }
    });
  } catch (error) {
    console.error('Erreur détaillée lors de l\'acceptation de l\'invitation:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'acceptation de l\'invitation',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
