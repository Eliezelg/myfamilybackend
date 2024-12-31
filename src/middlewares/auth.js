const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

exports.protect = async (req, res, next) => {
  try {
    console.log('Headers reçus:', req.headers);
    // 1. Vérifier si le token existe
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extrait:', token);
    }

    if (!token) {
      console.log('Aucun token trouvé');
      return res.status(401).json({
        status: 'error',
        message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
      });
    }

    // 2. Vérifier la validité du token
    let decoded;
    try {
      console.log('JWT_SECRET utilisé:', process.env.JWT_SECRET);
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé:', decoded);
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          status: 'error',
          message: 'Votre session a expiré. Veuillez vous reconnecter.'
        });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          status: 'error',
          message: 'Token invalide. Veuillez vous reconnecter.'
        });
      }
      throw error;
    }

    // 3. Vérifier si l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'L\'utilisateur associé à ce token n\'existe plus.'
      });
    }

    // 4. Accorder l'accès à la route protégée
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'authentification'
    });
  }
};
