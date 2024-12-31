const express = require('express');
const { protect } = require('../middlewares/auth');
const inviteController = require('../controllers/inviteController');

const router = express.Router({ mergeParams: true }); // Pour accéder aux paramètres de la route parent (familyId)

// Routes publiques
router.get('/check/:code', inviteController.checkInvite);
router.get('/by-code/:code', inviteController.getFamilyByInviteCode);

// Toutes les autres routes nécessitent une authentification
router.use(protect);

// Routes pour les invitations spécifiques à une famille
router.post('/', inviteController.createInvite);
router.post('/invite-link', inviteController.generateInviteLink);
router.post('/invite-code', inviteController.generateInviteCode);

// Routes pour rejoindre une famille
router.post('/accept/:code', inviteController.acceptInvite);
router.post('/join', inviteController.joinFamily);

module.exports = router;
