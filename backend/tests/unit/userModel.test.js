require('../setup');
const User = require('../../src/models/User');

describe('User Model — Schema Validation & Password Hashing', () => {
  const validUserData = {
    name: 'Sharvan Kumar',
    email: 'sharvan@college.edu',
    password: 'Password123!',
    phone: '+91 9876543210',
    location: {
      city: 'Bengaluru',
      area: 'Koramangala'
    }
  };

  it('should successfully create a user with valid attributes', async () => {
    const user = await User.create(validUserData);

    expect(user._id).toBeDefined();
    expect(user.name).toBe(validUserData.name);
    expect(user.email).toBe(validUserData.email.toLowerCase());
    expect(user.role).toBe('user');
    expect(user.isActive).toBe(true);
    expect(user.stats.itemsDonated).toBe(0);
    expect(user.stats.itemsReceived).toBe(0);
  });

  it('should hash the password before saving to the database', async () => {
    const user = await User.create(validUserData);

    // Fetch raw document including password
    const rawUser = await User.findById(user._id).select('+password');
    expect(rawUser.password).not.toBe(validUserData.password);
    expect(rawUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
  });

  it('should verify correct password using comparePassword instance method', async () => {
    const user = await User.create(validUserData);
    const rawUser = await User.findById(user._id).select('+password');

    const isMatch = await rawUser.comparePassword('Password123!');
    const isWrongMatch = await rawUser.comparePassword('WrongPassword!');

    expect(isMatch).toBe(true);
    expect(isWrongMatch).toBe(false);
  });

  it('should reject creation if required fields are missing', async () => {
    const emptyUser = new User({});
    let error;

    try {
      await emptyUser.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
    expect(error.errors['location.city']).toBeDefined();
    expect(error.errors['location.area']).toBeDefined();
  });

  it('should reject invalid email formats', async () => {
    const invalidEmailUser = new User({
      ...validUserData,
      email: 'not-an-email'
    });

    await expect(invalidEmailUser.save()).rejects.toThrow();
  });

  it('should enforce unique email constraint', async () => {
    await User.init(); // Wait for indexes to build
    await User.create(validUserData);

    const duplicateUser = new User({
      ...validUserData,
      name: 'Another User'
    });

    await expect(duplicateUser.save()).rejects.toThrow();
  });

  it('should produce sanitized public profile without password, email, or phone', async () => {
    const user = await User.create(validUserData);
    const publicProfile = user.toPublicProfile();

    expect(publicProfile.id).toBeDefined();
    expect(publicProfile.name).toBe(validUserData.name);
    expect(publicProfile.location.city).toBe('Bengaluru');
    expect(publicProfile.location.area).toBe('Koramangala');
    expect(publicProfile.stats).toBeDefined();

    // Sensitive data must never be exposed
    expect(publicProfile.password).toBeUndefined();
    expect(publicProfile.email).toBeUndefined();
    expect(publicProfile.phone).toBeUndefined();
  });
});
