const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { uploadFile, deleteFile } = require('../../services/fileService');

// Mock AWS SDK v3
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    PutObjectCommand: jest.fn().mockImplementation((args) => ({
      input: args
    })),
    DeleteObjectCommand: jest.fn().mockImplementation((args) => ({
      input: args
    }))
  };
});

describe('File Service', () => {
  let mockS3Client;

  beforeEach(() => {
    // Reset environment variables
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';

    // Clear all mocks
    jest.clearAllMocks();

    // Get reference to mock S3 client
    mockS3Client = new S3Client();
  });

  describe('uploadFile', () => {
    const mockFile = {
      buffer: Buffer.from('test-content'),
      mimetype: 'image/jpeg',
      originalname: 'test.jpg'
    };

    it('should upload a file successfully', async () => {
      // Mock successful upload
      mockS3Client.send.mockResolvedValueOnce({});

      const result = await uploadFile(mockFile, 'test-folder');

      // Verify S3 client was called with correct command
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      const commandArg = mockS3Client.send.mock.calls[0][0];
      
      // Verify command parameters
      expect(commandArg.input).toEqual({
        Bucket: 'test-bucket',
        Key: expect.stringMatching(/^test-folder\/.+\.jpg$/),
        Body: mockFile.buffer,
        ContentType: mockFile.mimetype,
        ACL: 'public-read'
      });

      // Verify returned URL format
      expect(result).toMatch(
        new RegExp(`https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/.+\\.jpg`)
      );
    });

    it('should handle upload errors', async () => {
      const errorMessage = 'Upload failed';
      mockS3Client.send.mockRejectedValueOnce(new Error(errorMessage));

      await expect(uploadFile(mockFile)).rejects.toThrow(
        `Erreur lors de l'upload du fichier: ${errorMessage}`
      );
    });

    it('should throw error for invalid file', async () => {
      await expect(uploadFile(null)).rejects.toThrow('Fichier invalide');
      await expect(uploadFile({})).rejects.toThrow('Fichier invalide');
    });
  });

  describe('deleteFile', () => {
    const mockFileUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/test-file.jpg';

    it('should delete a file successfully', async () => {
      // Mock successful deletion
      mockS3Client.send.mockResolvedValueOnce({});

      await deleteFile(mockFileUrl);

      // Verify S3 client was called with correct command
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      const commandArg = mockS3Client.send.mock.calls[0][0];
      
      // Verify command parameters
      expect(commandArg.input).toEqual({
        Bucket: 'test-bucket',
        Key: 'test-file.jpg'
      });
    });

    it('should handle delete errors', async () => {
      const errorMessage = 'Delete failed';
      mockS3Client.send.mockRejectedValueOnce(new Error(errorMessage));

      await expect(deleteFile(mockFileUrl)).rejects.toThrow(
        `Erreur lors de la suppression du fichier: ${errorMessage}`
      );
    });

    it('should throw error for invalid file URL', async () => {
      await expect(deleteFile(null)).rejects.toThrow('URL du fichier non fournie');
      await expect(deleteFile('invalid-url')).rejects.toThrow('URL de fichier invalide');
    });
  });
});
