const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  createFamily,
  getFamilies,
  getFamily,
  updateFamily,
  deleteFamily
} = require('../controllers/familyController');
const {
  generateInviteLink,
  generateInviteCode,
  joinFamilyWithToken,
  joinFamilyWithCode,
  getFamilyByInviteCode,
  joinFamily
} = require('../controllers/inviteController');

const router = express.Router();

// Routes publiques
router.get('/by-code/:code', getFamilyByInviteCode);

// Route pour rejoindre une famille (nécessite authentification)
router.post('/join', protect, joinFamily);

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour rejoindre une famille (doivent être avant les routes avec :familyId)
router.post('/join/token', joinFamilyWithToken);
router.post('/join/code', joinFamilyWithCode);

// Routes pour les invitations
router.post('/:familyId/invite-link', generateInviteLink);
router.post('/:familyId/invite-code', generateInviteCode);

// Routes principales des familles
router.route('/')
  .post(createFamily)
  .get(getFamilies);

router.route('/:familyId')
  .get(getFamily)
  .put(updateFamily)
  .delete(deleteFamily);

// Routes d'invitation
router.post('/:familyId/invites', generateInviteCode);
router.post('/:familyId/invites/invite-link', generateInviteLink);
router.post('/:familyId/invites/invite-code', generateInviteCode);

module.exports = router;
