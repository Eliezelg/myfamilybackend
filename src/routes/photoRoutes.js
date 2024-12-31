const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/auth');
const photoController = require('../controllers/photoController');

const router = express.Router();

// Configuration de Multer pour la gestion des fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type MIME
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Seuls les formats JPEG et PNG sont acceptés.'));
    }
  }
});

// Middleware de logging pour déboguer
router.use((req, res, next) => {
  console.log('📸 Route Photo appelée:', {
    method: req.method,
    url: req.url,
    params: req.params,
    path: req.path,
    baseUrl: req.baseUrl
  });
  next();
});

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les photos
router.get('/:familyId', photoController.getFamilyPhotos);
router.post('/:familyId/upload', upload.single('photo'), photoController.uploadPhoto);
router.delete('/:photoId', photoController.deletePhoto);

module.exports = router;
