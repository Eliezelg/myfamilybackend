const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_EXPIRES_IN = '24h';

// Générer un token JWT
const generateToken = (user) => {
  console.log('Génération du token pour l\'utilisateur:', user.id);
  console.log('JWT_SECRET utilisé:', process.env.JWT_SECRET);
  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  console.log('Token généré:', token);
  console.log('Token généré avec succès');
  return token;
};

// Inscription
exports.register = async (req, res) => {
  console.log('Tentative d\'inscription avec les données:', { ...req.body, password: '***' });
  try {
    const { email, password, firstName, lastName } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Email déjà utilisé:', email);
      return res.status(400).json({
        status: 'error',
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName
      }
    });
    console.log('Utilisateur créé avec succès:', user.id);

    // Générer le token JWT
    const token = generateToken(user);

    console.log('Inscription réussie pour:', email);
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token
      }
    });
  } catch (error) {
    console.error('Erreur détaillée lors de l\'inscription:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'inscription',
      details: error.message
    });
  }
};

// Connexion
exports.login = async (req, res) => {
  console.log('Tentative de connexion avec:', { ...req.body, password: '***' });
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('Utilisateur non trouvé:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token JWT
    const token = generateToken(user);
    console.log('Login réussi, token généré');

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la connexion'
    });
  }
};

// Réinitialisation du mot de passe
exports.forgotPassword = async (req, res) => {
  console.log('Tentative de réinitialisation du mot de passe pour:', req.body.email);
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('Utilisateur non trouvé:', email);
      return res.status(404).json({
        status: 'error',
        message: 'Aucun compte associé à cet email'
      });
    }

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: Date.now() + 3600000 // 1 heure
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetUrl
      }
    });

    console.log('Email de réinitialisation envoyé pour:', email);
    res.status(200).json({
      status: 'success',
      message: 'Email de réinitialisation envoyé'
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'envoi de l\'email de réinitialisation',
      details: error.message
    });
  }
};

// Réinitialisation du mot de passe avec le token
exports.resetPassword = async (req, res) => {
  console.log('Tentative de réinitialisation du mot de passe avec le token:', req.body.token);
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      console.log('Token invalide ou expiré:', token);
      return res.status(400).json({
        status: 'error',
        message: 'Token invalide ou expiré'
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    console.log('Mot de passe réinitialisé avec succès pour:', user.email);
    res.status(200).json({
      status: 'success',
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la réinitialisation du mot de passe',
      details: error.message
    });
  }
};

// Vérification de l'email
exports.verifyEmail = async (req, res) => {
  console.log('Tentative de vérification de l\'email avec le token:', req.params.token);
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      console.log('Utilisateur non trouvé:', decoded.id);
      return res.status(404).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true
      }
    });

    console.log('Email vérifié avec succès pour:', user.email);
    res.status(200).json({
      status: 'success',
      message: 'Email vérifié avec succès'
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la vérification de l\'email:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification de l\'email',
      details: error.message
    });
  }
};
