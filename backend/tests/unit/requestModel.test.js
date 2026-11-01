require('../setup');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Listing = require('../../src/models/Listing');
const Request = require('../../src/models/Request');
const { REQUEST_STATUS } = require('../../src/constants');

describe('Request Model — Schema Validation & Partial Filter Index', () => {
  let donor;
  let requester;
  let listing;

  beforeEach(async () => {
    donor = await User.create({
      name: 'Vikas Sharma',
      email: 'vikas@example.com',
      password: 'Password123!',
      location: { city: 'Bengaluru', area: 'Whitefield' }
    });

    requester = await User.create({
      name: 'Kavita Rao',
      email: 'kavita@example.com',
      password: 'Password123!',
      location: { city: 'Bengaluru', area: 'Electronic City' }
    });

    listing = await Listing.create({
      title: 'Graph Theory & Applications Textbook',
      description: 'Standard college graph theory book with solutions manual.',
      category: 'Textbooks & Study Material',
      condition: 'Like New',
      pickupLocation: { city: 'Bengaluru', area: 'Whitefield' },
      donorId: donor._id
    });

    // Ensure partial unique index is built in MongoDB
    await Request.init();
  });

  it('should successfully create a valid request with default PENDING status', async () => {
    const reqDoc = await Request.create({
      listingId: listing._id,
      requesterId: requester._id,
      donorId: donor._id,
      message: 'Hello Vikas, I need this graph theory book for my college project!'
    });

    expect(reqDoc._id).toBeDefined();
    expect(reqDoc.status).toBe(REQUEST_STATUS.PENDING);
    expect(reqDoc.message).toContain('graph theory book');
  });

  it('should reject creation if required fields are missing', async () => {
    const invalidDoc = new Request({});
    let error;

    try {
      await invalidDoc.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.listingId).toBeDefined();
    expect(error.errors.requesterId).toBeDefined();
    expect(error.errors.donorId).toBeDefined();
    expect(error.errors.message).toBeDefined();
  });

  it('should block duplicate ACTIVE requests (PENDING) via partial unique index', async () => {
    // 1. First PENDING request
    await Request.create({
      listingId: listing._id,
      requesterId: requester._id,
      donorId: donor._id,
      message: 'First active request for this book.'
    });

    // 2. Second PENDING request for same listing and requester must fail with duplicate key
    let duplicateError;
    try {
      await Request.create({
        listingId: listing._id,
        requesterId: requester._id,
        donorId: donor._id,
        message: 'Second active request attempted concurrently.'
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000); // MongoDB E11000 duplicate key error
  });

  it('should ALLOW re-requesting after an earlier request was REJECTED or CANCELLED', async () => {
    // 1. Initial request
    const firstReq = await Request.create({
      listingId: listing._id,
      requesterId: requester._id,
      donorId: donor._id,
      message: 'Initial request that gets cancelled by user.'
    });

    // 2. User cancels request
    firstReq.status = REQUEST_STATUS.CANCELLED;
    await firstReq.save();

    // 3. Re-requesting the same listing MUST SUCCEED because of the partialFilterExpression!
    const secondReq = await Request.create({
      listingId: listing._id,
      requesterId: requester._id,
      donorId: donor._id,
      message: 'Follow-up request after cancellation.'
    });

    expect(secondReq._id).toBeDefined();
    expect(secondReq.status).toBe(REQUEST_STATUS.PENDING);
    expect(secondReq._id.toString()).not.toBe(firstReq._id.toString());
  });
});
