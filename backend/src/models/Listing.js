const mongoose = require('mongoose');
const { CATEGORIES, CONDITIONS, LISTING_STATUS } = require('../constants');

const imageSubSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true
    },
    publicId: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category'
      }
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: CONDITIONS,
        message: '{VALUE} is not a valid condition'
      }
    },
    images: {
      type: [imageSubSchema],
      validate: [
        (val) => val.length <= 5,
        'A listing cannot exceed 5 images'
      ],
      default: []
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required']
    },
    status: {
      type: String,
      enum: {
        values: Object.values(LISTING_STATUS),
        message: '{VALUE} is not a valid listing status'
      },
      default: LISTING_STATUS.AVAILABLE
    },
    pickupLocation: {
      city: {
        type: String,
        required: [true, 'Pickup city is required'],
        trim: true
      },
      area: {
        type: String,
        required: [true, 'Pickup area is required'],
        trim: true
      },
      addressNote: {
        type: String,
        trim: true,
        maxlength: [200, 'Address note cannot exceed 200 characters']
      }
    },
    preferredPickupWindow: {
      type: String,
      trim: true,
      maxlength: [100, 'Pickup window note cannot exceed 100 characters']
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
// 1. Compound index for browsing listings filtered by status, city, category, and sorted by date
listingSchema.index({ status: 1, 'pickupLocation.city': 1, category: 1, createdAt: -1 });

// 2. Index for donor's own listings dashboard
listingSchema.index({ donorId: 1, status: 1, createdAt: -1 });

// 3. Full-text search index across title and description with relevance weighting
listingSchema.index(
  { title: 'text', description: 'text' },
  {
    weights: { title: 10, description: 5 },
    name: 'ListingTextIndex'
  }
);

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
