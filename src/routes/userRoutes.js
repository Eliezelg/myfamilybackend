const express = require('express');
const { protect } = require('../middlewares/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Routes protégées par l'authentification
router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

module.exports = router;
