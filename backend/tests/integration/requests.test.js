require('../setup');
const request = require('supertest');
const app = require('../../app');
const User = require('../../src/models/User');
const Listing = require('../../src/models/Listing');
const Request = require('../../src/models/Request');
const Exchange = require('../../src/models/Exchange');
const { LISTING_STATUS, REQUEST_STATUS, EXCHANGE_STATUS } = require('../../src/constants');

describe('Request Lifecycle API & Multi-Document Transactions', () => {
  let donorUser;
  let donorToken;
  let requesterUser1;
  let requesterToken1;
  let requesterUser2;
  let requesterToken2;
  let listing;

  beforeEach(async () => {
    // 1. Donor
    const donorRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Amit Patel',
        email: 'amit@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'Koramangala' }
      });
    donorUser = donorRes.body.data.user;
    donorToken = donorRes.body.data.token;

    // 2. Requester 1
    const reqRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Divya Nair',
        email: 'divya@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'BTM Layout' }
      });
    requesterUser1 = reqRes1.body.data.user;
    requesterToken1 = reqRes1.body.data.token;

    // 3. Requester 2
    const reqRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Karan Mehra',
        email: 'karan@example.com',
        password: 'Password123!',
        location: { city: 'Bengaluru', area: 'Jayanagar' }
      });
    requesterUser2 = reqRes2.body.data.user;
    requesterToken2 = reqRes2.body.data.token;

    // 4. Create an AVAILABLE listing
    const listingRes = await request(app)
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        title: 'Microprocessor 8086 Kit with LCD',
        description: 'Complete 8086 trainer kit with power supply and keypad.',
        category: 'Electronics & Gadgets',
        condition: 'Like New',
        pickupLocation: { city: 'Bengaluru', area: 'Koramangala' }
      });
    listing = listingRes.body.data;

    await Request.init();
    await Exchange.init();
  });

  describe('POST /api/v1/requests', () => {
    it('should submit request for available listing when authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Hi Amit, I would love to use this 8086 kit for my embedded lab course.'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(REQUEST_STATUS.PENDING);
      expect(res.body.data.listingId.toString()).toBe(listing._id);
      expect(res.body.data.requesterId.toString()).toBe(requesterUser1.id);
    });

    it('should reject request when user attempts to request their own listing', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          listingId: listing._id,
          message: 'Trying to request my own item.'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot request your own/i);
    });

    it('should reject duplicate active request from the same user with 409 Conflict', async () => {
      // First request
      await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Initial request.'
        })
        .expect(201);

      // Second request
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Duplicate request.'
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('DUPLICATE_ACTIVE_REQUEST');
    });

    it('should reject request when listing is already RESERVED', async () => {
      // Mark listing as RESERVED
      await Listing.updateOne({ _id: listing._id }, { status: LISTING_STATUS.RESERVED });

      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Requesting an already reserved item.'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot request this item/i);
    });
  });

  describe('PATCH /api/v1/requests/:id/cancel & Re-requesting', () => {
    let createdReq;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Original request.'
        });
      createdReq = res.body.data;
    });

    it('should allow requester to cancel their pending request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${createdReq._id}/cancel`)
        .set('Authorization', `Bearer ${requesterToken1}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(REQUEST_STATUS.CANCELLED);
    });

    it('should forbid other users from cancelling requester’s request', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${createdReq._id}/cancel`)
        .set('Authorization', `Bearer ${requesterToken2}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow user to submit a NEW request after cancelling an earlier one', async () => {
      // 1. Cancel first request
      await request(app)
        .patch(`/api/v1/requests/${createdReq._id}/cancel`)
        .set('Authorization', `Bearer ${requesterToken1}`)
        .expect(200);

      // 2. Submit new request for the same listing
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Submitting a fresh request after previous cancellation.'
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(REQUEST_STATUS.PENDING);
      expect(res.body.data._id.toString()).not.toBe(createdReq._id.toString());
    });
  });

  describe('PATCH /api/v1/requests/:id/accept (ACID Multi-Document Transaction)', () => {
    let req1;
    let req2;

    beforeEach(async () => {
      // Requester 1 submits
      const res1 = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Requester 1 submission.'
        });
      req1 = res1.body.data;

      // Requester 2 submits
      const res2 = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken2}`)
        .send({
          listingId: listing._id,
          message: 'Requester 2 competing submission.'
        });
      req2 = res2.body.data;
    });

    it('should execute transaction: reserve listing, accept request, reject competitors, and create exchange', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${req1._id}/accept`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.status).toBe(LISTING_STATUS.RESERVED);
      expect(res.body.data.request.status).toBe(REQUEST_STATUS.ACCEPTED);
      expect(res.body.data.exchange.status).toBe(EXCHANGE_STATUS.SCHEDULED);
      expect(res.body.data.exchange.recipientId.toString()).toBe(requesterUser1.id);

      // Verify in DB that competing request (req2) was rejected
      const competingReq = await Request.findById(req2._id);
      expect(competingReq.status).toBe(REQUEST_STATUS.REJECTED);

      // Verify listing in DB is RESERVED
      const updatedListing = await Listing.findById(listing._id);
      expect(updatedListing.status).toBe(LISTING_STATUS.RESERVED);

      // Verify exchange in DB is SCHEDULED
      const scheduledExchange = await Exchange.findOne({ listingId: listing._id });
      expect(scheduledExchange).toBeDefined();
      expect(scheduledExchange.status).toBe(EXCHANGE_STATUS.SCHEDULED);
    });

    it('should reject acceptance attempt by non-donor with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/requests/${req1._id}/accept`)
        .set('Authorization', `Bearer ${requesterToken2}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should return 409 Conflict if listing is no longer AVAILABLE (safe reservation check)', async () => {
      // First donor thread accepts req1
      await request(app)
        .patch(`/api/v1/requests/${req1._id}/accept`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      // Attempting to accept req2 now that listing is already RESERVED must fail with 400 or 409
      const res = await request(app)
        .patch(`/api/v1/requests/${req2._id}/accept`)
        .set('Authorization', `Bearer ${donorToken}`);

      // Status should be 400 (since req2 was already rejected) or 409 (conflict)
      expect([400, 409]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/requests/incoming & outgoing', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .send({
          listingId: listing._id,
          message: 'Checking incoming/outgoing lists.'
        });
    });

    it('should return incoming requests for donor', async () => {
      const res = await request(app)
        .get('/api/v1/requests/incoming')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].requesterId.name).toBe(requesterUser1.name);
      expect(res.body.data[0].listingId.title).toBe(listing.title);
    });

    it('should return outgoing requests for requester', async () => {
      const res = await request(app)
        .get('/api/v1/requests/outgoing')
        .set('Authorization', `Bearer ${requesterToken1}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].donorId.name).toBe(donorUser.name);
      expect(res.body.data[0].listingId.title).toBe(listing.title);
    });
  });
});
