const mongoose = require('mongoose');
const { REQUEST_STATUS } = require('../constants');

const requestSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing ID is required'],
      index: true
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester ID is required'],
      index: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true
    },
    message: {
      type: String,
      required: [true, 'Please provide a message explaining your intended use or pickup timeline'],
      trim: true,
      minlength: [5, 'Message must be at least 5 characters long'],
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    requestedPickupDate: {
      type: Date
    },
    status: {
      type: String,
      enum: {
        values: Object.values(REQUEST_STATUS),
        message: '{VALUE} is not a valid request status'
      },
      default: REQUEST_STATUS.PENDING,
      index: true
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

// Partial Unique Index:
// Enforces that a user can only have ONE ACTIVE (PENDING or ACCEPTED) request per listing.
// Historical REJECTED or CANCELLED requests do not block the user from submitting
// a new request if the listing remains or becomes available again.
requestSchema.index(
  { listingId: 1, requesterId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED] } }
  }
);

// Indexes for incoming and outgoing request queries
requestSchema.index({ donorId: 1, status: 1, createdAt: -1 });
requestSchema.index({ requesterId: 1, status: 1, createdAt: -1 });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
