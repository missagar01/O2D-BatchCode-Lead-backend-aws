const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const ApiError = require('../utils/apiError');
const { logger } = require('../utils/logger');

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.message || getReasonPhrase(statusCode);

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error(message, error);
  } else {
    logger.warn(message, error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: error instanceof ApiError ? error.details : undefined
  });
};

module.exports = errorHandler;
