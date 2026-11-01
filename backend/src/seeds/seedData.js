const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');
const Listing = require('../models/Listing');
const Request = require('../models/Request');
const Exchange = require('../models/Exchange');
const { LISTING_STATUS, REQUEST_STATUS, EXCHANGE_STATUS } = require('../constants');

const seedData = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reshare';
  console.log(`Connecting to MongoDB at ${uri}...`);

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Listing.deleteMany({}),
      Request.deleteMany({}),
      Exchange.deleteMany({})
    ]);

    console.log('Inserting seed users...');
    const users = await User.create([
      {
        name: 'Sharvan Kumar',
        email: 'sharvan@college.edu',
        password: 'Password123!',
        phone: '+91 9876543210',
        location: { city: 'Bengaluru', area: 'Koramangala' },
        stats: { itemsDonated: 3, itemsReceived: 1 },
        role: 'user'
      },
      {
        name: 'Ananya Deshmukh',
        email: 'ananya@college.edu',
        password: 'Password123!',
        phone: '+91 9123456789',
        location: { city: 'Bengaluru', area: 'HSR Layout' },
        stats: { itemsDonated: 2, itemsReceived: 2 },
        role: 'user'
      },
      {
        name: 'Rohan Mehra',
        email: 'rohan@college.edu',
        password: 'Password123!',
        phone: '+91 9988776655',
        location: { city: 'Bengaluru', area: 'Indiranagar' },
        stats: { itemsDonated: 1, itemsReceived: 3 },
        role: 'user'
      },
      {
        name: 'Dr. Anita Roy (Admin)',
        email: 'admin@college.edu',
        password: 'AdminPassword123!',
        phone: '+91 9000011111',
        location: { city: 'Bengaluru', area: 'Campus North' },
        role: 'admin'
      }
    ]);

    const [sharvan, ananya, rohan] = users;

    console.log('Inserting seed listings...');
    const listings = await Listing.create([
      {
        title: 'Data Structures and Algorithms in C++ (Mark Allen Weiss)',
        description: 'Hardcover textbook covering stacks, queues, trees, and hashing. Good condition with notes.',
        category: 'Textbooks & Study Material',
        condition: 'Gently Used',
        pickupLocation: { city: 'Bengaluru', area: 'Koramangala', addressNote: 'Outside Library Gate' },
        preferredPickupWindow: 'Weekdays 4:30 PM - 6:00 PM',
        donorId: sharvan._id,
        status: LISTING_STATUS.AVAILABLE,
        images: [{ url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', publicId: 'demo/dsa' }]
      },
      {
        title: 'Arduino Uno Starter Kit with Sensors',
        description: 'Original Arduino Uno board with ultrasonic, temperature sensors, breadboard and jumpers.',
        category: 'Electronics & Gadgets',
        condition: 'Like New',
        pickupLocation: { city: 'Bengaluru', area: 'Koramangala', addressNote: 'Hostel Block 3' },
        preferredPickupWindow: 'Anytime after 6 PM',
        donorId: sharvan._id,
        status: LISTING_STATUS.AVAILABLE,
        images: [{ url: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=500', publicId: 'demo/arduino' }]
      },
      {
        title: 'Computer Networking: A Top-Down Approach (Kurose & Ross)',
        description: 'Seventh edition textbook for 5th semester computer networks course.',
        category: 'Textbooks & Study Material',
        condition: 'Like New',
        pickupLocation: { city: 'Bengaluru', area: 'HSR Layout', addressNote: 'Sector 1 BDA Complex' },
        preferredPickupWindow: 'Weekends 11 AM - 2 PM',
        donorId: ananya._id,
        status: LISTING_STATUS.AVAILABLE,
        images: [{ url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=500', publicId: 'demo/kurose' }]
      },
      {
        title: 'Logitech Wireless Presenter with Red Laser Pointer',
        description: 'USB wireless presentation clicker. Ideal for seminar talks and viva presentations.',
        category: 'Electronics & Gadgets',
        condition: 'Like New',
        pickupLocation: { city: 'Bengaluru', area: 'HSR Layout', addressNote: 'Campus Main Reception' },
        preferredPickupWindow: 'Fridays 3 PM - 5 PM',
        donorId: ananya._id,
        status: LISTING_STATUS.COMPLETED,
        images: [{ url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', publicId: 'demo/presenter' }]
      },
      {
        title: 'Ergonomic Mesh Study Chair',
        description: 'Adjustable height office/study chair with lumbar support. Fully functional.',
        category: 'Furniture & Home',
        condition: 'Functional / Heavily Used',
        pickupLocation: { city: 'Bengaluru', area: 'Indiranagar', addressNote: '12th Main Road' },
        preferredPickupWindow: 'Saturday mornings',
        donorId: rohan._id,
        status: LISTING_STATUS.AVAILABLE,
        images: [{ url: 'https://images.unsplash.com/photo-1580481077195-c22ae249b674?w=500', publicId: 'demo/chair' }]
      }
    ]);

    const completedListing = listings[3]; // Logitech Presenter

    console.log('Inserting seed completed exchange...');
    const seedReq = await Request.create({
      listingId: completedListing._id,
      requesterId: sharvan._id,
      donorId: ananya._id,
      message: 'Need this clicker for my final year major project presentation next week.',
      status: REQUEST_STATUS.ACCEPTED
    });

    await Exchange.create({
      listingId: completedListing._id,
      requestId: seedReq._id,
      donorId: ananya._id,
      recipientId: sharvan._id,
      status: EXCHANGE_STATUS.COMPLETED,
      donorConfirmedAt: new Date(Date.now() - 86400000 * 2),
      recipientConfirmedAt: new Date(Date.now() - 86400000 * 2),
      completedAt: new Date(Date.now() - 86400000 * 2),
      donorFeedback: { rating: 5, comment: 'Great recipient, arrived right on time.' },
      recipientFeedback: { rating: 5, comment: 'Device worked flawlessly during my seminar!' }
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
