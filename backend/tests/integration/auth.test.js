require('../setup');
const request = require('supertest');
const app = require('../../app');
const User = require('../../src/models/User');

describe('Authentication API Endpoints', () => {
  const testUser = {
    name: 'Ananya Sharma',
    email: 'ananya@example.com',
    password: 'SecurePassword123',
    phone: '+91 9123456789',
    location: {
      city: 'Mumbai',
      area: 'Andheri West'
    }
  };

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user and return token with sanitized user data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.password).toBeUndefined(); // Excluded
      expect(res.body.data.user.role).toBe('user');
    });

    it('should return 409 Conflict when registering with an existing email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 422 Unprocessable when password is under 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          password: '123'
        })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should return 422 Unprocessable when email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'not-an-email'
        })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
    });

    it('should authenticate user with valid credentials and return JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword999'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 Unauthorized for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should return 403 Forbidden if user account is deactivated', async () => {
      // Deactivate user in DB
      await User.updateOne({ email: testUser.email.toLowerCase() }, { isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      token = registerRes.body.data.token;
    });

    it('should return current user profile when valid Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.phone).toBe(testUser.phone);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject request without Authorization header with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject request with forged or invalid token with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer forged_jwt_token_12345')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 acknowledging logout', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      const token = registerRes.body.data.token;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });
});
