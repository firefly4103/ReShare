require('../setup');
const request = require('supertest');
const app = require('../../app');
const User = require('../../src/models/User');
const Listing = require('../../src/models/Listing');
const Exchange = require('../../src/models/Exchange');
const Request = require('../../src/models/Request');
const { LISTING_STATUS, EXCHANGE_STATUS } = require('../../src/constants');

describe('Analytics API — MongoDB Multi-Stage Aggregation Pipelines', () => {
  let donor;
  let recipient;

  beforeEach(async () => {
    // 1. Create donor & recipient
    donor = await User.create({
      name: 'Dr. Ramesh Rao',
      email: 'ramesh.rao@univ.edu',
      password: 'Password123!',
      phone: '+91 9888877777', // Must never be exposed
      location: { city: 'Bengaluru', area: 'Jayanagar' }
    });

    recipient = await User.create({
      name: 'Sunita Joshi',
      email: 'sunita.joshi@univ.edu',
      password: 'Password123!',
      location: { city: 'Bengaluru', area: 'Basavanagudi' }
    });

    // 2. Create sample listings across categories
    const listing1 = await Listing.create({
      title: 'Physics Laboratory Apparatus Set',
      description: 'Prisms, lenses, vernier calipers and screw gauges.',
      category: 'Electronics & Gadgets',
      condition: 'Gently Used',
      pickupLocation: { city: 'Bengaluru', area: 'Jayanagar' },
      donorId: donor._id,
      status: LISTING_STATUS.COMPLETED
    });

    const listing2 = await Listing.create({
      title: 'Engineering Mathematics Volume 1',
      description: 'Calculus, matrices, and differential equations.',
      category: 'Textbooks & Study Material',
      condition: 'Like New',
      pickupLocation: { city: 'Bengaluru', area: 'Jayanagar' },
      donorId: donor._id,
      status: LISTING_STATUS.AVAILABLE
    });

    const listing3 = await Listing.create({
      title: 'Ergonomic Study Table & Chair',
      description: 'Adjustable wooden study table with armrest chair.',
      category: 'Furniture & Home',
      condition: 'Gently Used',
      pickupLocation: { city: 'Mumbai', area: 'Powai' },
      donorId: recipient._id,
      status: LISTING_STATUS.AVAILABLE
    });

    // 3. Create completed exchange for listing1
    const reqDoc = await Request.create({
      listingId: listing1._id,
      requesterId: recipient._id,
      donorId: donor._id,
      message: 'Need physics kit for physics department lab.'
    });

    await Exchange.create({
      listingId: listing1._id,
      requestId: reqDoc._id,
      donorId: donor._id,
      recipientId: recipient._id,
      status: EXCHANGE_STATUS.COMPLETED,
      donorConfirmedAt: new Date(),
      recipientConfirmedAt: new Date(),
      completedAt: new Date()
    });

    // Update user stats
    await User.updateOne({ _id: donor._id }, { 'stats.itemsDonated': 1 });
    await User.updateOne({ _id: recipient._id }, { 'stats.itemsReceived': 1 });
  });

  describe('GET /api/v1/analytics/platform-summary', () => {
    it('should compute platform metrics via $facet aggregation pipeline', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/platform-summary')
        .expect(200);

      expect(res.body.success).toBe(true);
      const metrics = res.body.data;

      // Overall metrics verification
      expect(metrics.totalUsers).toBe(2);
      expect(metrics.totalListings).toBe(3);
      expect(metrics.availableListings).toBe(2);
      expect(metrics.completedListings).toBe(1);
      expect(metrics.completedExchanges).toBe(1);

      // Category breakdown from $facet
      expect(Array.isArray(metrics.categoryBreakdown)).toBe(true);
      expect(metrics.categoryBreakdown.length).toBeGreaterThan(0);
      const electronicsCat = metrics.categoryBreakdown.find(
        (c) => c._id === 'Electronics & Gadgets'
      );
      expect(electronicsCat).toBeDefined();
      expect(electronicsCat.completedCount).toBe(1);

      // Top cities distribution
      expect(Array.isArray(metrics.topCities)).toBe(true);
      const bengaluruCity = metrics.topCities.find((c) => c._id === 'Bengaluru');
      expect(bengaluruCity).toBeDefined();
      expect(bengaluruCity.listingCount).toBe(2);
    });
  });

  describe('GET /api/v1/analytics/user-impact/:id', () => {
    it('should return aggregated category donations without exposing private details', async () => {
      const res = await request(app)
        .get(`/api/v1/analytics/user-impact/${donor._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const impact = res.body.data;

      expect(impact.user.name).toBe('Dr. Ramesh Rao');
      expect(impact.stats.itemsDonated).toBe(1);
      expect(impact.stats.itemsReceived).toBe(0);

      // Aggregated category donations
      expect(impact.stats.categoryBreakdown.length).toBe(1);
      expect(impact.stats.categoryBreakdown[0]._id).toBe('Electronics & Gadgets');
      expect(impact.stats.categoryBreakdown[0].itemsDonated).toBe(1);

      // STRICT PRIVACY CHECK: credentials and phone must never be exposed
      expect(impact.user.email).toBeUndefined();
      expect(impact.user.phone).toBeUndefined();
      expect(impact.user.password).toBeUndefined();
    });

    it('should return 400 for invalid user ObjectId format', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/user-impact/invalid-id-xyz')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent user ID', async () => {
      const nonExistentId = '660c1f28b49e6f3b48f9a999';
      const res = await request(app)
        .get(`/api/v1/analytics/user-impact/${nonExistentId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
