const multer = require('multer');
const ApiError = require('../utils/apiError');

// Store uploaded files in memory for direct Cloudinary streaming
const storage = multer.memoryStorage();

// Validate file type (magic MIME types)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file format: ${file.mimetype}. Only JPEG, PNG, and WEBP images are supported.`,
        [{ field: file.fieldname, message: 'Invalid file format' }],
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per image
    files: 5 // Maximum 5 images per listing
  }
});

// Middleware for listing images upload (up to 5 images)
const uploadListingImages = upload.array('images', 5);

module.exports = {
  uploadListingImages
};
