const CATEGORIES = [
  'Textbooks & Study Material',
  'Electronics & Gadgets',
  'Clothing & Footwear',
  'Furniture & Home',
  'Kitchenware',
  'Sports & Fitness',
  'Other'
];

const CONDITIONS = [
  'New',
  'Like New',
  'Gently Used',
  'Functional / Heavily Used'
];

const LISTING_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  COMPLETED: 'COMPLETED',
  INACTIVE: 'INACTIVE'
};

const REQUEST_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

const EXCHANGE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

module.exports = {
  CATEGORIES,
  CONDITIONS,
  LISTING_STATUS,
  REQUEST_STATUS,
  EXCHANGE_STATUS
};
