const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const ApiError = require('./src/utils/apiError');
const ApiResponse = require('./src/utils/apiResponse');
const errorHandler = require('./src/middlewares/errorHandler');
const { apiLimiter } = require('./src/middlewares/rateLimiter');

// Import Route Handlers
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const listingRoutes = require('./src/routes/listingRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const exchangeRoutes = require('./src/routes/exchangeRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

const app = express();

// Security HTTP Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parsers with payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection Sanitization: strips prohibited $ and . operators
app.use(mongoSanitize());

// HTTP Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  return ApiResponse.success(res, 200, 'ReShare API is operational', {
    status: 'healthy',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/exchanges', exchangeRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Catch Unmatched Routes (404)
app.all('*', (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
