const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Configuration AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Fonction pour générer un nom de fichier unique
const generateUniqueFileName = (originalName) => {
  const extension = originalName.split('.').pop();
  return `${uuidv4()}.${extension}`;
};

// Fonction pour extraire la clé S3 d'une URL
const extractKeyFromUrl = (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch (error) {
    throw new Error('URL de fichier invalide');
  }
};

// Upload d'un fichier vers S3
exports.uploadFile = async (file, folder = '') => {
  if (!file || !file.buffer) {
    throw new Error('Fichier invalide');
  }

  const fileName = generateUniqueFileName(file.originalname);
  const key = folder ? `${folder}/${fileName}` : fileName;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Erreur lors de l\'upload sur S3:', error);
    throw new Error('Erreur lors de l\'upload du fichier: ' + error.message);
  }
};

// Suppression d'un fichier de S3
exports.deleteFile = async (fileUrl) => {
  if (!fileUrl) {
    throw new Error('URL du fichier non fournie');
  }

  try {
    const key = extractKeyFromUrl(fileUrl);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('Erreur lors de la suppression sur S3:', error);
    throw new Error('Erreur lors de la suppression du fichier: ' + error.message);
  }
};
