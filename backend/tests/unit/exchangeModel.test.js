require('../setup');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Listing = require('../../src/models/Listing');
const Request = require('../../src/models/Request');
const Exchange = require('../../src/models/Exchange');
const { EXCHANGE_STATUS } = require('../../src/constants');

describe('Exchange Model — Schema Validation, Dual Confirmation & Partial Unique Index', () => {
  let donor;
  let recipient;
  let listing;
  let requestDoc;

  beforeEach(async () => {
    donor = await User.create({
      name: 'Nikhil Sen',
      email: 'nikhil@example.com',
      password: 'Password123!',
      location: { city: 'Bengaluru', area: 'Malleshwaram' }
    });

    recipient = await User.create({
      name: 'Sneha Roy',
      email: 'sneha@example.com',
      password: 'Password123!',
      location: { city: 'Bengaluru', area: 'Rajajinagar' }
    });

    listing = await Listing.create({
      title: 'Digital Electronics Lab Kit',
      description: 'Breadboard, jumper wires, logic gate ICs and 5V regulator.',
      category: 'Electronics & Gadgets',
      condition: 'Functional / Heavily Used',
      pickupLocation: { city: 'Bengaluru', area: 'Malleshwaram' },
      donorId: donor._id
    });

    requestDoc = await Request.create({
      listingId: listing._id,
      requesterId: recipient._id,
      donorId: donor._id,
      message: 'Need this kit for my 4th sem logic design lab experiments.'
    });

    // Ensure partial unique index is built in MongoDB
    await Exchange.init();
  });

  it('should successfully create an exchange in SCHEDULED status with null confirmation timestamps', async () => {
    const exchange = await Exchange.create({
      listingId: listing._id,
      requestId: requestDoc._id,
      donorId: donor._id,
      recipientId: recipient._id
    });

    expect(exchange._id).toBeDefined();
    expect(exchange.status).toBe(EXCHANGE_STATUS.SCHEDULED);
    expect(exchange.donorConfirmedAt).toBeNull();
    expect(exchange.recipientConfirmedAt).toBeNull();
    expect(exchange.completedAt).toBeNull();
  });

  it('should prevent scheduling duplicate active exchanges for the same listing via partial unique index', async () => {
    // 1. Create first SCHEDULED exchange
    await Exchange.create({
      listingId: listing._id,
      requestId: requestDoc._id,
      donorId: donor._id,
      recipientId: recipient._id,
      status: EXCHANGE_STATUS.SCHEDULED
    });

    // 2. Attempting second SCHEDULED exchange for same listing must fail with duplicate key (11000)
    let duplicateError;
    try {
      await Exchange.create({
        listingId: listing._id,
        requestId: requestDoc._id,
        donorId: donor._id,
        recipientId: recipient._id,
        status: EXCHANGE_STATUS.SCHEDULED
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).toBeDefined();
    expect(duplicateError.code).toBe(11000);
  });

  it('should ALLOW creating a new exchange after a prior exchange was CANCELLED', async () => {
    // 1. First exchange created and then cancelled
    const firstExchange = await Exchange.create({
      listingId: listing._id,
      requestId: requestDoc._id,
      donorId: donor._id,
      recipientId: recipient._id,
      status: EXCHANGE_STATUS.SCHEDULED
    });

    firstExchange.status = EXCHANGE_STATUS.CANCELLED;
    firstExchange.cancellationReason = 'Recipient could not travel to pickup point.';
    await firstExchange.save();

    // 2. Creating a second exchange for the same listing must SUCCEED because the previous is CANCELLED!
    const secondExchange = await Exchange.create({
      listingId: listing._id,
      requestId: requestDoc._id,
      donorId: donor._id,
      recipientId: recipient._id,
      status: EXCHANGE_STATUS.SCHEDULED
    });

    expect(secondExchange._id).toBeDefined();
    expect(secondExchange.status).toBe(EXCHANGE_STATUS.SCHEDULED);
    expect(secondExchange._id.toString()).not.toBe(firstExchange._id.toString());
  });
});
