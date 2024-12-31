const { getRecentActivities, createActivity } = require('../../controllers/activityController');
const Activity = require('../../models/Activity');
const { Op } = require('sequelize');

// Mock des dépendances
jest.mock('../../models/Activity');

describe('Activity Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getRecentActivities', () => {
    it('should return recent activities for a user', async () => {
      const mockActivities = [
        {
          id: 'activity1',
          type: 'CHILD_ADDED',
          description: 'Nouvel enfant ajouté'
        },
        {
          id: 'activity2',
          type: 'PROFILE_UPDATED',
          description: 'Profil mis à jour'
        }
      ];

      Activity.findAll.mockResolvedValue(mockActivities);

      await getRecentActivities(req, res);

      expect(Activity.findAll).toHaveBeenCalledWith({
        where: {
          userId: req.user.id,
          createdAt: {
            [Op.gte]: expect.any(Date)
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        activities: mockActivities
      });
    });

    it('should handle errors when fetching activities', async () => {
      Activity.findAll.mockRejectedValue(new Error('Database error'));

      await getRecentActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erreur lors de la récupération des activités'
      });
    });
  });

  describe('createActivity', () => {
    it('should create a new activity', async () => {
      const activityData = {
        userId: 'user123',
        type: 'CHILD_ADDED',
        description: 'Nouvel enfant ajouté',
        metadata: { childId: 'child123' }
      };

      Activity.create.mockResolvedValue({
        id: 'activity123',
        ...activityData
      });

      await createActivity(
        activityData.userId,
        activityData.type,
        activityData.description,
        activityData.metadata
      );

      expect(Activity.create).toHaveBeenCalledWith(activityData);
    });

    it('should handle errors when creating activity', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      Activity.create.mockRejectedValue(new Error('Database error'));

      await createActivity('user123', 'TEST', 'Test activity');

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should create activity with default empty metadata', async () => {
      await createActivity('user123', 'TEST', 'Test activity');

      expect(Activity.create).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'TEST',
        description: 'Test activity',
        metadata: {}
      });
    });
  });
});
