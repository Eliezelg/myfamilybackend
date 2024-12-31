const {
  getChildren,
  addChild,
  updateChild,
  deleteChild,
  uploadPhoto
} = require('../../controllers/childController');
const Child = require('../../models/Child');
const fileService = require('../../services/fileService');

// Mock des dépendances
jest.mock('../../models/Child');
jest.mock('../../services/fileService');

describe('Child Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {
        firstName: 'Alice',
        lastName: 'Doe',
        dateOfBirth: '2020-01-01',
        photo: 'photo-url'
      },
      params: { id: 'child123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getChildren', () => {
    it('should return all children for a user', async () => {
      const mockChildren = [
        { id: 'child1', firstName: 'Alice' },
        { id: 'child2', firstName: 'Bob' }
      ];

      Child.findAll.mockResolvedValue(mockChildren);

      await getChildren(req, res);

      expect(Child.findAll).toHaveBeenCalledWith({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        children: mockChildren
      });
    });

    it('should handle errors when fetching children', async () => {
      Child.findAll.mockRejectedValue(new Error('Database error'));

      await getChildren(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erreur lors de la récupération des enfants'
      });
    });
  });

  describe('addChild', () => {
    it('should create a new child', async () => {
      const mockChild = {
        id: 'child123',
        ...req.body,
        userId: req.user.id
      };

      Child.create.mockResolvedValue(mockChild);

      await addChild(req, res);

      expect(Child.create).toHaveBeenCalledWith({
        ...req.body,
        userId: req.user.id
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        child: mockChild
      });
    });

    it('should handle errors when creating a child', async () => {
      Child.create.mockRejectedValue(new Error('Database error'));

      await addChild(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erreur lors de l\'ajout de l\'enfant'
      });
    });
  });

  describe('updateChild', () => {
    it('should update an existing child', async () => {
      const mockChild = {
        id: 'child123',
        ...req.body,
        userId: req.user.id,
        update: jest.fn()
      };

      Child.findOne.mockResolvedValue(mockChild);

      await updateChild(req, res);

      expect(mockChild.update).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        child: mockChild
      });
    });

    it('should handle non-existent child', async () => {
      Child.findOne.mockResolvedValue(null);

      await updateChild(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Enfant non trouvé'
      });
    });
  });

  describe('deleteChild', () => {
    it('should delete an existing child', async () => {
      const mockChild = {
        id: 'child123',
        photo: 'photo-url',
        destroy: jest.fn()
      };

      Child.findOne.mockResolvedValue(mockChild);
      fileService.deleteFile.mockResolvedValue();

      await deleteChild(req, res);

      expect(mockChild.destroy).toHaveBeenCalled();
      expect(fileService.deleteFile).toHaveBeenCalledWith('photo-url');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Enfant supprimé avec succès'
      });
    });

    it('should handle non-existent child', async () => {
      Child.findOne.mockResolvedValue(null);

      await deleteChild(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Enfant non trouvé'
      });
    });
  });

  describe('uploadPhoto', () => {
    beforeEach(() => {
      req.file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg'
      };
    });

    it('should upload a photo successfully', async () => {
      const mockPhotoUrl = 'https://example.com/photo.jpg';
      fileService.uploadFile.mockResolvedValue(mockPhotoUrl);

      await uploadPhoto(req, res);

      expect(fileService.uploadFile).toHaveBeenCalledWith(
        req.file,
        'children-photos'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        url: mockPhotoUrl
      });
    });

    it('should handle missing file', async () => {
      req.file = undefined;

      await uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Aucun fichier fourni'
      });
    });

    it('should handle upload errors', async () => {
      fileService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      await uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erreur lors de l\'upload de la photo'
      });
    });
  });
});
