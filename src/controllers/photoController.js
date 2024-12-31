const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configuration
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const THUMBNAIL_SIZE = 200;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Créer le dossier d'upload s'il n'existe pas
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
    console.log('Dossier uploads existe déjà');
  } catch {
    console.log('Création du dossier uploads');
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// Optimiser et sauvegarder l'image
const processAndSaveImage = async (file, familyId) => {
  console.log('Début du traitement de l\'image');
  console.log('Fichier reçu:', file);

  const uniqueId = uuidv4();
  const ext = path.extname(file.originalname);
  const fileName = `${uniqueId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const thumbnailPath = path.join(UPLOAD_DIR, `thumb_${fileName}`);

  console.log('Chemins des fichiers:', {
    filePath,
    thumbnailPath,
    uploadDir: UPLOAD_DIR
  });

  // Traiter l'image avec Sharp
  const image = sharp(file.buffer);
  const metadata = await image.metadata();

  console.log('Métadonnées de l\'image:', metadata);

  // Redimensionner si nécessaire (max 2000x2000)
  if (metadata.width > 2000 || metadata.height > 2000) {
    console.log('Redimensionnement de l\'image');
    image.resize(2000, 2000, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Optimiser selon le type
  if (metadata.format === 'jpeg') {
    console.log('Optimisation JPEG');
    image.jpeg({ quality: 85 });
  } else if (metadata.format === 'png') {
    console.log('Optimisation PNG');
    image.png({ compressionLevel: 9 });
  }

  console.log('Sauvegarde de l\'image principale...');
  // Sauvegarder l'image principale
  await image.toFile(filePath);

  console.log('Création de la miniature...');
  // Créer la miniature
  await image
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'centre'
    })
    .toFile(thumbnailPath);

  console.log('Traitement de l\'image terminé');

  return {
    fileName,
    fileSize: metadata.size || file.size,
    fileType: file.mimetype,
    width: metadata.width,
    height: metadata.height,
    url: `/uploads/${fileName}`,
    thumbnailUrl: `/uploads/thumb_${fileName}`
  };
};

// Contrôleur pour uploader une photo
exports.uploadPhoto = async (req, res) => {
  const prisma = req.prisma;
  try {
    console.log('Début de l\'upload de photo');
    console.log('Paramètres:', req.params);
    console.log('Corps de la requête:', req.body);
    console.log('Fichiers:', req.files);
    console.log('Fichier unique:', req.file);

    const { familyId } = req.params;
    const { title, description } = req.body;

    if (!familyId) {
      console.error('familyId manquant');
      return res.status(400).json({
        status: 'error',
        message: 'ID de famille manquant'
      });
    }

    // Vérifier si l'utilisateur est membre de la famille
    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id
      }
    });

    if (!member) {
      console.error('Utilisateur non membre de la famille');
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas membre de cette famille'
      });
    }

    if (!req.file && (!req.files || req.files.length === 0)) {
      console.error('Aucun fichier uploadé');
      return res.status(400).json({
        status: 'error',
        message: 'Aucun fichier n\'a été uploadé'
      });
    }

    const file = req.file || req.files[0];

    // Vérifier le type de fichier
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      console.error('Type de fichier non supporté:', file.mimetype);
      return res.status(400).json({
        status: 'error',
        message: 'Type de fichier non supporté. Seuls les formats JPEG et PNG sont acceptés'
      });
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      console.error('Fichier trop volumineux:', file.size);
      return res.status(400).json({
        status: 'error',
        message: 'Le fichier est trop volumineux. Taille maximum: 10MB'
      });
    }

    await ensureUploadDir();

    console.log('Traitement de l\'image...');
    // Traiter et sauvegarder l'image
    const {
      fileName,
      fileSize,
      fileType,
      width,
      height,
      url,
      thumbnailUrl
    } = await processAndSaveImage(file, familyId);

    console.log('Création de l\'entrée dans la base de données...');
    // Créer l'entrée dans la base de données
    const photo = await prisma.photo.create({
      data: {
        familyId,
        uploadedById: req.user.id,
        title: title || file.originalname,
        description,
        fileName,
        fileSize,
        fileType,
        width,
        height,
        url,
        thumbnailUrl
      }
    });

    console.log('Photo uploadée avec succès:', photo);

    res.status(201).json({
      status: 'success',
      data: {
        photo
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'upload de la photo',
      details: error.message
    });
  }
};

// Récupérer toutes les photos d'une famille
exports.getFamilyPhotos = async (req, res) => {
  const prisma = req.prisma;
  try {
    console.log('Récupération des photos de la famille');
    const { familyId } = req.params;

    // Vérifier si l'utilisateur est membre de la famille
    const member = await prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: req.user.id
      }
    });

    if (!member) {
      console.error('Utilisateur non membre de la famille');
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas membre de cette famille'
      });
    }

    const photos = await prisma.photo.findMany({
      where: {
        familyId
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Photos récupérées:', photos);

    res.json({
      status: 'success',
      data: {
        photos
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des photos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des photos'
    });
  }
};

// Supprimer une photo
exports.deletePhoto = async (req, res) => {
  const prisma = req.prisma;
  try {
    console.log('Suppression de la photo');
    const { photoId } = req.params;

    // Récupérer la photo avec les informations de la famille
    const photo = await prisma.photo.findUnique({
      where: {
        id: photoId
      },
      include: {
        family: {
          include: {
            members: {
              where: {
                userId: req.user.id
              }
            }
          }
        }
      }
    });

    if (!photo) {
      console.error('Photo non trouvée');
      return res.status(404).json({
        status: 'error',
        message: 'Photo non trouvée'
      });
    }

    // Vérifier si l'utilisateur est membre de la famille
    if (!photo.family.members.length) {
      console.error('Utilisateur non membre de la famille');
      return res.status(403).json({
        status: 'error',
        message: 'Vous n\'êtes pas autorisé à supprimer cette photo'
      });
    }

    // Supprimer les fichiers
    try {
      console.log('Suppression des fichiers');
      await fs.unlink(path.join(UPLOAD_DIR, photo.fileName));
      await fs.unlink(path.join(UPLOAD_DIR, `thumb_${photo.fileName}`));
    } catch (error) {
      console.error('Erreur lors de la suppression des fichiers:', error);
    }

    // Supprimer l'entrée de la base de données
    await prisma.photo.delete({
      where: {
        id: photoId
      }
    });

    console.log('Photo supprimée avec succès');

    res.json({
      status: 'success',
      message: 'Photo supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression de la photo'
    });
  }
};
