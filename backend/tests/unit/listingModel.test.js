require('../setup');
const mongoose = require('mongoose');
const Listing = require('../../src/models/Listing');
const User = require('../../src/models/User');
const { CATEGORIES, CONDITIONS, LISTING_STATUS } = require('../../src/constants');

describe('Listing Model — Schema Validation, Enums & Indexes', () => {
  let donor;

  beforeEach(async () => {
    donor = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: 'Password123!',
      location: { city: 'Bengaluru', area: 'HSR Layout' }
    });
  });

  const validListingData = () => ({
    title: 'Operating System Concepts (10th Edition)',
    description: 'Silberschatz textbook, hardcover, excellent condition with no markings.',
    category: 'Textbooks & Study Material',
    condition: 'Like New',
    pickupLocation: {
      city: 'Bengaluru',
      area: 'HSR Layout Sector 2',
      addressNote: 'Near BDA Complex'
    },
    preferredPickupWindow: 'Weekends 10 AM to 1 PM',
    donorId: donor._id,
    images: [
      { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', publicId: 'sample_id' }
    ]
  });

  it('should successfully create a listing with valid attributes and default to AVAILABLE status', async () => {
    const listing = await Listing.create(validListingData());

    expect(listing._id).toBeDefined();
    expect(listing.title).toBe('Operating System Concepts (10th Edition)');
    expect(listing.status).toBe(LISTING_STATUS.AVAILABLE);
    expect(listing.images.length).toBe(1);
    expect(listing.donorId.toString()).toBe(donor._id.toString());
  });

  it('should reject creation if category is not in the allowed enum', async () => {
    const invalidData = validListingData();
    invalidData.category = 'InvalidCategoryName';

    let error;
    try {
      await Listing.create(invalidData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.category).toBeDefined();
  });

  it('should reject creation if condition is not in the allowed enum', async () => {
    const invalidData = validListingData();
    invalidData.condition = 'BrandSpankingNew';

    let error;
    try {
      await Listing.create(invalidData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.condition).toBeDefined();
  });

  it('should reject creation if more than 5 images are provided', async () => {
    const invalidData = validListingData();
    invalidData.images = [
      { url: 'https://example.com/1.jpg' },
      { url: 'https://example.com/2.jpg' },
      { url: 'https://example.com/3.jpg' },
      { url: 'https://example.com/4.jpg' },
      { url: 'https://example.com/5.jpg' },
      { url: 'https://example.com/6.jpg' } // 6th image violates validation
    ];

    let error;
    try {
      await Listing.create(invalidData);
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.images).toBeDefined();
  });

  it('should reject creation if required fields are missing', async () => {
    const emptyListing = new Listing({});
    let error;
    try {
      await emptyListing.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.description).toBeDefined();
    expect(error.errors.category).toBeDefined();
    expect(error.errors.condition).toBeDefined();
    expect(error.errors.donorId).toBeDefined();
    expect(error.errors['pickupLocation.city']).toBeDefined();
    expect(error.errors['pickupLocation.area']).toBeDefined();
  });

  it('should have indexes configured on the collection', async () => {
    await Listing.init(); // Build indexes
    const indexes = await Listing.collection.getIndexes();

    // Check compound index exists
    const hasCompoundIndex = Object.keys(indexes).some((name) =>
      name.includes('status_1_pickupLocation.city_1_category_1')
    );
    expect(hasCompoundIndex).toBe(true);

    // Check text search index exists
    const hasTextIndex = Object.keys(indexes).some((name) =>
      name.includes('ListingTextIndex') || name.includes('text')
    );
    expect(hasTextIndex).toBe(true);
  });
});
