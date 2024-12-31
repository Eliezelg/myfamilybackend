const express = require('express');
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../validators/authValidator');

const router = express.Router();

// Routes d'authentification
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

module.exports = router;
