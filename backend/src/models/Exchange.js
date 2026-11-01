const mongoose = require('mongoose');
const { EXCHANGE_STATUS } = require('../constants');

const feedbackSubSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [300, 'Comment cannot exceed 300 characters']
    }
  },
  { _id: false }
);

const exchangeSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required']
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request ID is required']
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: Object.values(EXCHANGE_STATUS),
        message: '{VALUE} is not a valid exchange status'
      },
      default: EXCHANGE_STATUS.SCHEDULED,
      index: true
    },
    donorConfirmedAt: {
      type: Date,
      default: null
    },
    recipientConfirmedAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Cancellation reason cannot exceed 300 characters']
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: {
      type: Date,
      default: null
    },
    donorFeedback: feedbackSubSchema,
    recipientFeedback: feedbackSubSchema
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

// Partial Unique Index:
// Enforces that a listing can have at most ONE active ('SCHEDULED') or 'COMPLETED' exchange.
// If an exchange is 'CANCELLED', the listing may be safely re-reserved/re-exchanged without index conflict.
exchangeSchema.index(
  { listingId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [EXCHANGE_STATUS.SCHEDULED, EXCHANGE_STATUS.COMPLETED] }
    }
  }
);

// Indexes for user dashboard lookups
exchangeSchema.index({ donorId: 1, status: 1 });
exchangeSchema.index({ recipientId: 1, status: 1 });

const Exchange = mongoose.model('Exchange', exchangeSchema);

module.exports = Exchange;
