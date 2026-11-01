const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

if (process.env.NODE_ENV !== 'test') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`[WARN] Environment variable ${envVar} is not set. Using defaults if available.`);
    }
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reshare',
  jwtSecret: process.env.JWT_SECRET || 'reshare_fallback_jwt_secret_college_demo_2026',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  }
};
