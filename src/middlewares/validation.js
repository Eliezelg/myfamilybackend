const { body, validationResult } = require('express-validator');

// Middleware de validation pour l'inscription
exports.validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/\d/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];

// Middleware de validation pour la connexion
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];
