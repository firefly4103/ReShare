require('../setup');
const request = require('supertest');
const app = require('../../app');
const User = require('../../src/models/User');

describe('User Profile API — Privacy & Information Exposure Tests', () => {
  let createdUser;

  beforeEach(async () => {
    createdUser = await User.create({
      name: 'Rohan Verma',
      email: 'rohan.private@example.com',
      password: 'StrongSecretPassword1',
      phone: '+91 9999888877',
      location: {
        city: 'Bengaluru',
        area: 'Indiranagar'
      },
      stats: {
        itemsDonated: 5,
        itemsReceived: 2
      }
    });
  });

  describe('GET /api/v1/users/profile/:id', () => {
    it('should return public profile with only public fields', async () => {
      const res = await request(app)
        .get(`/api/v1/users/profile/${createdUser._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const profile = res.body.data.user;

      // Public fields must be present
      expect(profile.name).toBe('Rohan Verma');
      expect(profile.location.city).toBe('Bengaluru');
      expect(profile.location.area).toBe('Indiranagar');
      expect(profile.stats.itemsDonated).toBe(5);
      expect(profile.stats.itemsReceived).toBe(2);
      expect(profile.joinedAt).toBeDefined();

      // STRICT PRIVACY VERIFICATION: Private fields must NEVER be exposed
      expect(profile.password).toBeUndefined();
      expect(profile.email).toBeUndefined();
      expect(profile.phone).toBeUndefined();
      expect(profile.role).toBeUndefined();
      expect(profile.isActive).toBeUndefined();
    });

    it('should return 400 Bad Request for invalid MongoDB ObjectId', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile/invalid-hex-id-123')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('BAD_REQUEST');
    });

    it('should return 404 Not Found for non-existent user ID', async () => {
      const nonExistentId = '660c1f28b49e6f3b48f9a999';
      const res = await request(app)
        .get(`/api/v1/users/profile/${nonExistentId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('NOT_FOUND');
    });

    it('should return 404 Not Found for deactivated user', async () => {
      await User.updateOne({ _id: createdUser._id }, { isActive: false });

      const res = await request(app)
        .get(`/api/v1/users/profile/${createdUser._id}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });
  });
});
