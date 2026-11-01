require('../setup');
const request = require('supertest');
const app = require('../../app');
const User = require('../../src/models/User');
const Listing = require('../../src/models/Listing');
const Request = require('../../src/models/Request');
const Exchange = require('../../src/models/Exchange');
const { LISTING_STATUS, REQUEST_STATUS, EXCHANGE_STATUS } = require('../../src/constants');

describe('Exchange Lifecycle — Dual Confirmation & Cancellation Rollback', () => {
  let donorUser;
  let donorToken;
  let recipientUser;
  let recipientToken;
  let thirdUser;
  let thirdToken;
  let listing;
  let requestDoc;
  let exchange;

  beforeEach(async () => {
    // 1. Donor
    const donorRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Suresh Kumar',
        email: 'suresh@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'Rajajinagar' }
      });
    donorUser = donorRes.body.data.user;
    donorToken = donorRes.body.data.token;

    // 2. Recipient
    const recipientRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Pooja Hegde',
        email: 'pooja@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'Vijayanagar' }
      });
    recipientUser = recipientRes.body.data.user;
    recipientToken = recipientRes.body.data.token;

    // 3. Third user (unauthorized participant)
    const thirdRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Dravid',
        email: 'rahul@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'Indiranagar' }
      });
    thirdUser = thirdRes.body.data.user;
    thirdToken = thirdRes.body.data.token;

    // 4. Create listing
    const listingRes = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        title: 'Complete Electronics Workshop Multimeter',
        description: 'Auto-ranging digital multimeter with test leads and thermocouple.',
        category: 'Electronics & Gadgets',
        condition: 'Like New',
        pickupLocation: { city: 'Bengaluru', area: 'Rajajinagar' }
      });
    listing = listingRes.body.data;

    // 5. Submit request
    const reqRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        listingId: listing._id,
        message: 'Need this multimeter for my electrical circuits laboratory project.'
      });
    requestDoc = reqRes.body.data;

    // 6. Donor accepts request -> schedules exchange via transaction
    const acceptRes = await request(app)
      .patch(`/api/v1/requests/${requestDoc._id}/accept`)
      .set('Authorization', `Bearer ${donorToken}`);
    exchange = acceptRes.body.data.exchange;
  });

  describe('Dual Confirmation Handover Flow (POST /api/v1/exchanges/:id/confirm)', () => {
    it('should record donor confirmation and keep status SCHEDULED awaiting recipient', async () => {
      const res = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(EXCHANGE_STATUS.SCHEDULED);
      expect(res.body.data.donorConfirmedAt).toBeDefined();
      expect(res.body.data.recipientConfirmedAt).toBeNull();
      expect(res.body.message).toMatch(/waiting for recipient/i);

      // Verify listing remains RESERVED
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.status).toBe(LISTING_STATUS.RESERVED);
    });

    it('should transition exchange and listing to COMPLETED when BOTH participants confirm', async () => {
      // 1. Donor confirms
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      // 2. Recipient confirms -> triggers completion transaction
      const res = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(EXCHANGE_STATUS.COMPLETED);
      expect(res.body.data.donorConfirmedAt).toBeDefined();
      expect(res.body.data.recipientConfirmedAt).toBeDefined();
      expect(res.body.data.completedAt).toBeDefined();

      // Verify listing in DB is COMPLETED
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.status).toBe(LISTING_STATUS.COMPLETED);

      // Verify user statistics in DB incremented atomically
      const updatedDonor = await User.findById(donorUser.id);
      expect(updatedDonor.stats.itemsDonated).toBe(1);

      const updatedRecipient = await User.findById(recipientUser.id);
      expect(updatedRecipient.stats.itemsReceived).toBe(1);
    });

    it('should work when recipient confirms FIRST and donor confirms SECOND', async () => {
      // 1. Recipient confirms first
      const res1 = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(res1.body.data.status).toBe(EXCHANGE_STATUS.SCHEDULED);
      expect(res1.body.data.recipientConfirmedAt).toBeDefined();
      expect(res1.body.data.donorConfirmedAt).toBeNull();

      // 2. Donor confirms second
      const res2 = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res2.body.data.status).toBe(EXCHANGE_STATUS.COMPLETED);
      expect(res2.body.data.completedAt).toBeDefined();
    });

    it('should reject confirmation from a non-participant with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${thirdToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not an authorized participant/i);
    });

    it('should reject confirmation if exchange is already COMPLETED', async () => {
      // Complete exchange
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${donorToken}`);
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${recipientToken}`);

      // Attempt another confirmation
      const res = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot confirm exchange/i);
    });
  });

  describe('Exchange Cancellation & Safe Rollback (POST /api/v1/exchanges/:id/cancel)', () => {
    it('should cancel scheduled exchange and restore listing to AVAILABLE', async () => {
      const res = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/cancel`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          cancellationReason: 'Recipient was unable to make it to the scheduled meeting point.'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.exchange.status).toBe(EXCHANGE_STATUS.CANCELLED);
      expect(res.body.data.exchange.cancellationReason).toContain('unable to make it');
      expect(res.body.data.listingRestored).toBe(true);

      // Verify listing is restored to AVAILABLE in DB
      const restoredListing = await Listing.findById(listing._id);
      expect(restoredListing.status).toBe(LISTING_STATUS.AVAILABLE);
    });

    it('should allow scheduling a NEW exchange on the restored listing after cancellation', async () => {
      // 1. Cancel initial exchange
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/cancel`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ cancellationReason: 'Pickup aborted.' })
        .expect(200);

      // 2. Third user requests the newly available item
      const newReqRes = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${thirdToken}`)
        .send({
          listingId: listing._id,
          message: 'I can pick this multimeter up today!'
        })
        .expect(201);

      // 3. Donor accepts third user's request -> creates NEW exchange without unique index collision
      const newAcceptRes = await request(app)
        .patch(`/api/v1/requests/${newReqRes.body.data._id}/accept`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(newAcceptRes.body.data.exchange.status).toBe(EXCHANGE_STATUS.SCHEDULED);
      expect(newAcceptRes.body.data.exchange._id.toString()).not.toBe(exchange._id);

      // Verify both exchange records exist in DB (1 CANCELLED, 1 SCHEDULED)
      const totalExchanges = await Exchange.countDocuments({ listingId: listing._id });
      expect(totalExchanges).toBe(2);
    });

    it('should reject cancellation by non-participant with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/cancel`)
        .set('Authorization', `Bearer ${thirdToken}`)
        .send({ cancellationReason: 'Intruder cancellation.' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject cancellation if exchange is already COMPLETED', async () => {
      // Complete exchange
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${donorToken}`);
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${recipientToken}`);

      // Attempt cancellation
      const res = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/cancel`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ cancellationReason: 'Too late to cancel.' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot cancel/i);
    });
  });

  describe('Exchange Feedback (POST /api/v1/exchanges/:id/feedback)', () => {
    beforeEach(async () => {
      // Fully complete exchange
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${donorToken}`);
      await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/confirm`)
        .set('Authorization', `Bearer ${recipientToken}`);
    });

    it('should allow donor and recipient to submit feedback on completed exchange', async () => {
      // Donor feedback
      const donorFeedbackRes = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/feedback`)
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ rating: 5, comment: 'Punctual and very polite recipient!' })
        .expect(200);

      expect(donorFeedbackRes.body.data.donorFeedback.rating).toBe(5);

      // Recipient feedback
      const recipientFeedbackRes = await request(app)
        .post(`/api/v1/exchanges/${exchange._id}/feedback`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .send({ rating: 5, comment: 'Item in mint condition. Thanks a lot!' })
        .expect(200);

      expect(recipientFeedbackRes.body.data.recipientFeedback.rating).toBe(5);
    });
  });

  describe('GET /api/v1/exchanges/:id & /my-exchanges', () => {
    it('should allow participant to view exchange details with populated relations', async () => {
      const res = await request(app)
        .get(`/api/v1/exchanges/${exchange._id}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.listingId.title).toBe(listing.title);
      expect(res.body.data.donorId.name).toBe(donorUser.name);
      expect(res.body.data.recipientId.name).toBe(recipientUser.name);
    });

    it('should reject non-participant from viewing exchange details with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/exchanges/${exchange._id}`)
        .set('Authorization', `Bearer ${thirdToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return my exchanges list for participant', async () => {
      const res = await request(app)
        .get('/api/v1/exchanges/my-exchanges')
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });
  });
});
