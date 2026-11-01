const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri, { autoIndex: true });
}, 60000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (replSet) {
    await replSet.stop();
  }
}, 60000);
