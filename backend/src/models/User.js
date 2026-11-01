const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Never returned in normal queries
    },
    phone: {
      type: String,
      trim: true,
      select: false // Protected: only exposed when user views own profile
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'user'
    },
    location: {
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
      },
      area: {
        type: String,
        required: [true, 'Area/neighborhood is required'],
        trim: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude] for future geospatial enhancement
        default: undefined
      }
    },
    stats: {
      itemsDonated: {
        type: Number,
        default: 0,
        min: 0
      },
      itemsReceived: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for query performance
userSchema.index({ 'location.city': 1 });
userSchema.index({ role: 1 });

// Pre-save hook: Hash password securely before writing document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method: Verify candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Safe public profile projection
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    location: {
      city: this.location.city,
      area: this.location.area
    },
    stats: {
      itemsDonated: this.stats.itemsDonated,
      itemsReceived: this.stats.itemsReceived
    },
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
