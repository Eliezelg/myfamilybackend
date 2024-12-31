const { body } = require('express-validator');

exports.validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[a-z]/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre'),
  body('firstName')
    .notEmpty()
    .withMessage('Le prénom est requis'),
  body('lastName')
    .notEmpty()
    .withMessage('Le nom est requis')
];

exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];
