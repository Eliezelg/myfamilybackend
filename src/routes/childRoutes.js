const express = require('express');
const { protect } = require('../middlewares/auth');
const childController = require('../controllers/childController');

const router = express.Router({ mergeParams: true }); // Pour accéder aux paramètres de la route parent (familyId)

// Toutes les routes nécessitent une authentification
router.use(protect);

router.route('/')
  .get(childController.getChildren)
  .post(childController.addChild);

module.exports = router;
