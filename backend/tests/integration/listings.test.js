require('../setup');
const request = require('supertest');
const app = require('../../app');
const User = require('../../src/models/User');
const Listing = require('../../src/models/Listing');
const { LISTING_STATUS } = require('../../src/constants');

describe('Listings API Endpoints — CRUD, Search & Filtering', () => {
  let donorUser;
  let donorToken;
  let secondUser;
  let secondToken;

  beforeEach(async () => {
    // 1. Create primary donor user
    const donorRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Gupta',
        email: 'aarav@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'Koramangala' }
      });
    donorUser = donorRes.body.data.user;
    donorToken = donorRes.body.data.token;

    // 2. Create second user (for unauthorized update/delete tests)
    const secondRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Meera Iyer',
        email: 'meera@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'Indiranagar' }
      });
    secondUser = secondRes.body.data.user;
    secondToken = secondRes.body.data.token;
  });

  const sampleListingPayload = () => ({
    title: 'Introduction to Algorithms (CLRS 3rd Ed)',
    description: 'Comprehensive computer science algorithms textbook. Clean pages, no highlights.',
    category: 'Textbooks & Study Material',
    condition: 'Gently Used',
    pickupLocation: {
      city: 'Bengaluru',
      area: 'Koramangala 4th Block',
      addressNote: 'Near Sony World Signal'
    },
    preferredPickupWindow: 'Weekdays after 6 PM',
    images: [
      { url: 'https://res.cloudinary.com/demo/image/upload/clrs.jpg', publicId: 'sample/clrs' }
    ]
  });

  describe('POST /api/v1/listings', () => {
    it('should create a listing when authenticated with valid payload', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(sampleListingPayload())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.title).toBe('Introduction to Algorithms (CLRS 3rd Ed)');
      expect(res.body.data.status).toBe(LISTING_STATUS.AVAILABLE);
      expect(res.body.data.donorId.toString()).toBe(donorUser.id);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .send(sampleListingPayload())
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid listing data with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          title: 'Hi', // too short (<3 chars)
          description: 'Short', // too short (<10 chars)
          category: 'FakeCategory'
        })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should accept multipart/form-data upload with mock image file', async () => {
      const fakeImageBuffer = Buffer.from('fake-image-content-for-testing');

      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${donorToken}`)
        .field('title', 'Mechanical Keyboard (Cherry Blue)')
        .field('description', 'RGB mechanical gaming keyboard in fully functional condition.')
        .field('category', 'Electronics & Gadgets')
        .field('condition', 'Gently Used')
        .field('pickupLocation', JSON.stringify({ city: 'Bengaluru', area: 'Koramangala' }))
        .attach('images', fakeImageBuffer, { filename: 'keyboard.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.images.length).toBe(1);
      expect(res.body.data.images[0].url).toBeDefined();
    });
  });

  describe('GET /api/v1/listings', () => {
    beforeEach(async () => {
      // Seed two listings in different categories and locations
      await Listing.create({
        ...sampleListingPayload(),
        title: 'Algorithms Textbook',
        category: 'Textbooks & Study Material',
        pickupLocation: { city: 'Bengaluru', area: 'Koramangala' },
        donorId: donorUser.id
      });

      await Listing.create({
        ...sampleListingPayload(),
        title: 'Scientific Calculator Casio fx-991EX',
        description: 'Classwiz engineering scientific calculator with matrix and vector modes.',
        category: 'Electronics & Gadgets',
        pickupLocation: { city: 'Mumbai', area: 'Bandra' },
        donorId: secondUser.id
      });

      // Ensure text indexes are ready
      await Listing.init();
    });

    it('should return all available listings with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/v1/listings')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
      expect(res.body.meta.page).toBe(1);
    });

    it('should filter listings by category', async () => {
      const res = await request(app)
        .get('/api/v1/listings?category=Electronics%20%26%20Gadgets')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Scientific Calculator Casio fx-991EX');
    });

    it('should filter listings by city', async () => {
      const res = await request(app)
        .get('/api/v1/listings?city=Mumbai')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].pickupLocation.city).toBe('Mumbai');
    });

    it('should perform text search using MongoDB $text index', async () => {
      const res = await request(app)
        .get('/api/v1/listings?q=engineering')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('Scientific Calculator');
    });

    it('should populate safe donor information without exposing sensitive details', async () => {
      const res = await request(app)
        .get('/api/v1/listings')
        .expect(200);

      const listing = res.body.data[0];
      expect(listing.donorId.name).toBeDefined();
      // Sensitive fields must NOT be present
      expect(listing.donorId.password).toBeUndefined();
      expect(listing.donorId.email).toBeUndefined();
      expect(listing.donorId.phone).toBeUndefined();
    });
  });

  describe('GET /api/v1/listings/:id', () => {
    it('should return listing details by ID', async () => {
      const created = await Listing.create({
        ...sampleListingPayload(),
        donorId: donorUser.id
      });

      const res = await request(app)
        .get(`/api/v1/listings/${created._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(created.title);
      expect(res.body.data.donorId.name).toBe(donorUser.name);
    });

    it('should return 404 for non-existent listing ID', async () => {
      const nonExistentId = '660c21a3b49e6f3b48f9a999';
      const res = await request(app)
        .get(`/api/v1/listings/${nonExistentId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/listings/:id', () => {
    let listing;

    beforeEach(async () => {
      listing = await Listing.create({
        ...sampleListingPayload(),
        donorId: donorUser.id
      });
    });

    it('should allow the owner to update listing attributes when status is AVAILABLE', async () => {
      const res = await request(app)
        .put(`/api/v1/listings/${listing._id}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          title: 'Algorithms Textbook 4th Edition (Updated)',
          condition: 'Like New'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Algorithms Textbook 4th Edition (Updated)');
      expect(res.body.data.condition).toBe('Like New');
    });

    it('should reject update from a user who is not the owner with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/v1/listings/${listing._id}`)
        .set('Authorization', `Bearer ${secondToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject update if listing status is RESERVED', async () => {
      // Mark listing as RESERVED
      listing.status = LISTING_STATUS.RESERVED;
      await listing.save();

      const res = await request(app)
        .put(`/api/v1/listings/${listing._id}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ title: 'Attempted Update While Reserved' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot edit listing/i);
    });
  });

  describe('DELETE /api/v1/listings/:id', () => {
    let listing;

    beforeEach(async () => {
      listing = await Listing.create({
        ...sampleListingPayload(),
        donorId: donorUser.id
      });
    });

    it('should allow owner to archive listing (setting status to INACTIVE)', async () => {
      const res = await request(app)
        .delete(`/api/v1/listings/${listing._id}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(LISTING_STATUS.INACTIVE);

      // Verify in DB
      const updated = await Listing.findById(listing._id);
      expect(updated.status).toBe(LISTING_STATUS.INACTIVE);
    });

    it('should reject deletion by non-owner with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/v1/listings/${listing._id}`)
        .set('Authorization', `Bearer ${secondToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject deletion if listing is currently RESERVED', async () => {
      listing.status = LISTING_STATUS.RESERVED;
      await listing.save();

      const res = await request(app)
        .delete(`/api/v1/listings/${listing._id}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/actively reserved/i);
    });
  });

  describe('GET /api/v1/listings/my-listings', () => {
    beforeEach(async () => {
      // Seed 2 listings for donorUser, 1 for secondUser
      await Listing.create({
        ...sampleListingPayload(),
        title: 'Donor Book 1',
        donorId: donorUser.id
      });
      await Listing.create({
        ...sampleListingPayload(),
        title: 'Donor Book 2',
        donorId: donorUser.id
      });
      await Listing.create({
        ...sampleListingPayload(),
        title: 'Second User Book',
        donorId: secondUser.id
      });
    });

    it('should return only listings posted by the calling donor', async () => {
      const res = await request(app)
        .get('/api/v1/listings/my-listings')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(2);
      res.body.data.forEach((item) => {
        expect(item.donorId.toString()).toBe(donorUser.id);
      });
    });
  });
});
