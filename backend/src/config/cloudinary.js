const cloudinary = require('cloudinary').v2;
const config = require('./env');
const logger = require('../utils/logger');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

/**
 * Upload an image buffer to Cloudinary via stream
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} [folder='reshare/listings'] - Target Cloudinary folder
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadImageBuffer = (buffer, folder = 'reshare/listings') => {
  return new Promise((resolve, reject) => {
    // If in test environment or mock credentials, return a mock upload payload
    if (
      process.env.NODE_ENV === 'test' ||
      !config.cloudinary.cloudName ||
      config.cloudinary.cloudName === 'placeholder'
    ) {
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return resolve({
        url: `https://res.cloudinary.com/demo/image/upload/v1/${folder}/${mockId}.jpg`,
        publicId: `${folder}/${mockId}`
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary stream upload error: %o', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by its public ID
 * @param {string} publicId
 * @returns {Promise<void>}
 */
const deleteImage = async (publicId) => {
  if (
    process.env.NODE_ENV === 'test' ||
    !config.cloudinary.cloudName ||
    config.cloudinary.cloudName === 'placeholder' ||
    !publicId ||
    publicId.startsWith('mock_')
  ) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.warn('Failed to delete image from Cloudinary with publicId %s: %s', publicId, error.message);
  }
};

module.exports = {
  cloudinary,
  uploadImageBuffer,
  deleteImage
};
